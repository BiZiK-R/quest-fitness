import { describe, expect, it } from 'vitest';
import { computeSessionEndsAt, remainingMsUntilEndsAt } from './compute-session-ends-at';

describe('computeSessionEndsAt', () => {
  it('adds planned duration to startedAt anchor', () => {
    const startedAt = '2026-10-01T10:00:00.000Z';
    const endsAt = computeSessionEndsAt(startedAt, 45);
    expect(endsAt).toBe(new Date('2026-10-01T10:45:00.000Z').getTime());
  });

  it('remainingMsUntilEndsAt uses absolute endsAt not tick count', () => {
    const endsAt = computeSessionEndsAt('2026-10-01T10:00:00.000Z', 60);
    const now = new Date('2026-10-01T10:30:00.000Z').getTime();
    expect(remainingMsUntilEndsAt(endsAt, now)).toBe(30 * 60_000);
  });
});
