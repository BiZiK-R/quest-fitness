import { describe, expect, it } from 'vitest';
import {
  paletteContrastOnSessionSunken,
  SET_MODIFIER_PALETTE,
} from './set-modifier-palette';

describe('SET_MODIFIER_PALETTE', () => {
  it('has 6–8 entries with ≥3:1 contrast on session sunken surface', () => {
    expect(SET_MODIFIER_PALETTE.length).toBeGreaterThanOrEqual(6);
    expect(SET_MODIFIER_PALETTE.length).toBeLessThanOrEqual(8);
    for (const entry of SET_MODIFIER_PALETTE) {
      expect(paletteContrastOnSessionSunken(entry.hex)).toBeGreaterThanOrEqual(3);
    }
  });
});
