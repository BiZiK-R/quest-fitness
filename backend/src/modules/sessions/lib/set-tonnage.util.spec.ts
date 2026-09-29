import { describe, expect, it } from 'vitest';
import { setTonnageKg, tonnageGrowthPercent } from './set-tonnage.util';

describe('setTonnageKg', () => {
  it('multiplies weight and reps when both set', () => {
    expect(setTonnageKg(50, 10)).toBe(500);
  });

  it('treats null weight as 0', () => {
    expect(setTonnageKg(null, 10)).toBe(0);
  });

  it('treats null reps as 0', () => {
    expect(setTonnageKg(50, null)).toBe(0);
  });

  it('treats both null as 0', () => {
    expect(setTonnageKg(null, null)).toBe(0);
  });
});

describe('tonnageGrowthPercent', () => {
  it('returns positive growth rounded to one decimal', () => {
    expect(tonnageGrowthPercent(550, 500)).toBe(10);
  });

  it('returns null when prior tonnage is zero', () => {
    expect(tonnageGrowthPercent(100, 0)).toBeNull();
  });
});
