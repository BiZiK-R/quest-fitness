import { describe, expect, it } from 'vitest';
import { setSyncIndicatorLabel } from './set-sync-state';

describe('setSyncIndicatorLabel', () => {
  it('returns exact Russian labels for sync states', () => {
    expect(setSyncIndicatorLabel('saved')).toBe('сохранено');
    expect(setSyncIndicatorLabel('saving')).toBe('сохраняется');
    expect(setSyncIndicatorLabel('retry')).toBe('не сохранилось, повторить');
  });
});
