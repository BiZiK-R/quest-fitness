import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfigFromFile } from 'vite';

describe('vite server proxy', () => {
  it('proxies /api to the backend target', async () => {
    const configFile = resolve(import.meta.dirname, '../../vite.config.ts');
    const loaded = await loadConfigFromFile(
      { command: 'serve', mode: 'test' },
      configFile,
    );

    const apiProxy = loaded?.config.server?.proxy?.['/api'];
    expect(apiProxy).toBeDefined();
    expect(apiProxy).toMatchObject({
      target: 'http://localhost:3000',
      changeOrigin: true,
    });
  });

  it('keeps proxy block present in source (regression guard)', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../../vite.config.ts'),
      'utf8',
    );
    expect(source).toContain("'/api'");
    expect(source).toContain('http://localhost:3000');
  });
});
