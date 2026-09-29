import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const composePath = join(repoRoot, 'docker-compose.yml');

type ComposeFile = {
  services?: Record<
    string,
    {
      image?: string;
      build?: string | { context?: string };
      depends_on?: Record<string, { condition?: string }> | string[];
      environment?: Record<string, string> | string[];
      volumes?: unknown[];
      healthcheck?: unknown;
      ports?: string[];
    }
  >;
};

function loadCompose(): ComposeFile {
  expect(existsSync(composePath), 'docker-compose.yml must exist at repo root').toBe(
    true,
  );
  return parse(readFileSync(composePath, 'utf8')) as ComposeFile;
}

function envKeys(service: ComposeFile['services'][string]): string[] {
  const env = service?.environment;
  if (!env) return [];
  if (Array.isArray(env)) {
    return env.map((e) => e.split('=')[0]?.trim()).filter(Boolean) as string[];
  }
  return Object.keys(env);
}

describe('docker-compose scaffold (Story 1.1)', () => {
  it('declares services frontend, backend, postgres with postgres:16', () => {
    const compose = loadCompose();
    const names = Object.keys(compose.services ?? {});
    expect(names.sort()).toEqual(['backend', 'frontend', 'postgres']);

    const postgres = compose.services!.postgres!;
    expect(postgres.image).toBe('postgres:16');
  });

  it('configures postgres with volume, healthcheck, and POSTGRES_* env', () => {
    const compose = loadCompose();
    const postgres = compose.services!.postgres!;

    expect(postgres.volumes?.length).toBeGreaterThan(0);
    expect(postgres.healthcheck).toBeDefined();

    const keys = envKeys(postgres);
    expect(keys).toContain('POSTGRES_USER');
    expect(keys).toContain('POSTGRES_PASSWORD');
    expect(keys).toContain('POSTGRES_DB');
  });

  it('builds backend from ./backend and waits for healthy postgres', () => {
    const compose = loadCompose();
    const backend = compose.services!.backend!;
    const build =
      typeof backend.build === 'string' ? backend.build : backend.build?.context;

    expect(build).toBe('./backend');

    const depends = backend.depends_on;
    expect(depends).toBeDefined();
    if (depends && !Array.isArray(depends)) {
      expect(depends.postgres?.condition).toBe('service_healthy');
    }

    const keys = envKeys(backend);
    for (const key of [
      'DATABASE_URL',
      'SESSION_SECRET',
      'GYM_TIMEZONE',
      'SEED_ADMIN_LOGIN',
      'SEED_ADMIN_PASSWORD',
    ]) {
      expect(keys, `backend must declare ${key}`).toContain(key);
    }
  });

  it('builds frontend with repo context + frontend/Dockerfile, depends on backend, publishes port', () => {
    const compose = loadCompose();
    const frontend = compose.services!.frontend!;
    expect(frontend.build).toBeDefined();
    expect(typeof frontend.build).toBe('object');
    const build = frontend.build as { context?: string; dockerfile?: string };
    expect(build.context).toBe('.');
    expect(build.dockerfile).toBe('frontend/Dockerfile');
    expect(frontend.depends_on).toBeDefined();

    const ports = frontend.ports ?? [];
    const publishes5173Or80 = ports.some(
      (p) => p.startsWith('5173:') || p.startsWith('80:') || p === '5173' || p === '80',
    );
    expect(publishes5173Or80).toBe(true);
  });

  it('documents env in .env.example without default admin password', () => {
    const examplePath = join(repoRoot, '.env.example');
    expect(existsSync(examplePath)).toBe(true);
    const content = readFileSync(examplePath, 'utf8');
    expect(content).toMatch(/DATABASE_URL/);
    expect(content).toMatch(/SESSION_SECRET/);
    expect(content).toMatch(/GYM_TIMEZONE=Europe\/Moscow/);
    expect(content).toMatch(/SEED_ADMIN_LOGIN/);
    expect(content).toMatch(/SEED_ADMIN_PASSWORD/);
    expect(content).toMatch(/POSTGRES_/);
    expect(content.toLowerCase()).not.toMatch(/seed_admin_password=\s*admin/i);
    expect(content.toLowerCase()).not.toMatch(/password=\s*changeme/i);
  });

  it('frontend nginx proxies /api to backend:3000', () => {
    const nginxPath = join(repoRoot, 'frontend', 'nginx.conf');
    expect(existsSync(nginxPath)).toBe(true);
    const nginx = readFileSync(nginxPath, 'utf8');
    expect(nginx).toMatch(/location\s+\/api/);
    expect(nginx).toMatch(/proxy_pass\s+http:\/\/backend:3000/);
  });

  it('backend entrypoint applies prisma migrate deploy before start', () => {
    const entryPath = join(repoRoot, 'backend', 'docker-entrypoint.sh');
    expect(existsSync(entryPath)).toBe(true);
    const entry = readFileSync(entryPath, 'utf8');
    expect(entry).toMatch(/prisma migrate deploy/);
    expect(entry).toMatch(/dist\/main\.js/);
  });
});
