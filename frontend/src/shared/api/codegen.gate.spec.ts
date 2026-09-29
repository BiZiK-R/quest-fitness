import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertOpenApiPresent } from './assert-openapi-present';

const canonicalOpenApiPath = resolve(
  import.meta.dirname,
  '../../../../backend/openapi/openapi.yaml',
);
const codegenScript = resolve(import.meta.dirname, '../../../scripts/codegen.mjs');
const schemaPath = resolve(import.meta.dirname, './schema.d.ts');

describe('OpenAPI codegen gate', () => {
  it('assertOpenApiPresent throws when YAML is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qf-openapi-'));
    const missingPath = join(dir, 'openapi.yaml');

    expect(() => assertOpenApiPresent(missingPath)).toThrow(/OpenAPI contract missing/);

    rmSync(dir, { recursive: true, force: true });
  });

  it('assertOpenApiPresent passes when YAML exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qf-openapi-'));
    const path = join(dir, 'openapi.yaml');
    writeFileSync(path, 'openapi: 3.0.3\ninfo:\n  title: t\n  version: 1\npaths: {}\n');

    expect(() => assertOpenApiPresent(path)).not.toThrow();

    rmSync(dir, { recursive: true, force: true });
  });

  it('committed canonical openapi.yaml exists for frontend codegen', () => {
    expect(() => assertOpenApiPresent(canonicalOpenApiPath)).not.toThrow();
  });

  it('generated schema includes auth API paths', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    expect(schema).toContain('"/api/auth/login"');
    expect(schema).toContain('"/api/auth/logout"');
    expect(schema).toContain('"/api/auth/me"');
    expect(schema).toContain('"/api/trainer/ping"');
    expect(schema).toContain('"/api/clients"');
    expect(schema).not.toMatch(/ownerTrainerId/);
    expect(schema).toContain('"/api/clients/{clientId}/invites"');
    expect(schema).toContain('"/api/clients/{clientId}/invites/active"');
    expect(schema).toContain('"/api/invites/{token}/register"');
    expect(schema).toContain('"/api/invites/{token}"');
    expect(schema).toContain('"/api/muscle-groups"');
    expect(schema).toContain('"/api/exercises"');
    expect(schema).toContain('"/api/exercises/{id}/archive"');
    expect(schema).toContain('"/api/templates"');
    expect(schema).toContain('"/api/templates/{id}"');
    expect(schema).toContain('"/api/macrocycles"');
    expect(schema).toContain('"/api/macrocycles/{id}"');
  });

  it('codegen.mjs exits non-zero when contract path is missing', () => {
    const result = spawnSync(process.execPath, [codegenScript], {
      env: {
        ...process.env,
        OPENAPI_CONTRACT_PATH: join(tmpdir(), 'qf-missing-openapi.yaml'),
      },
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/OpenAPI contract missing/);
  });
});
