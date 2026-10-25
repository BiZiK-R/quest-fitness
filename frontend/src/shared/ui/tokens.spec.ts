import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokensPath = join(dirname(fileURLToPath(import.meta.url)), 'tokens.css');

describe('tokens.css', () => {
  it('defines accent-red and content-max from DESIGN.md', () => {
    const css = readFileSync(tokensPath, 'utf8');
    expect(css).toMatch(/#C33F46/i);
    expect(css).toMatch(/640px/);
    expect(css).toMatch(/#0A0909/i);
  });
});
