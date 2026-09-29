import { describe, expect, it } from 'vitest';
import {
  computeRestEndsAt,
  DEFAULT_REST_SECONDS,
  exerciseIndexAfterSetConfirm,
  formatRestCountdown,
  remainingMsUntilEndsAt,
  shouldStartRestAfterSet,
  type RestTimerExercise,
} from './rest-after-set';

const exercises = (
  rows: Array<{ id: string; sortOrder: number; supersetGroupId?: string | null }>,
): RestTimerExercise[] => rows;

describe('shouldStartRestAfterSet', () => {
  it('starts rest when exercise has no superset group', () => {
    const list = exercises([
      { id: 'a', sortOrder: 0, supersetGroupId: null },
      { id: 'b', sortOrder: 1, supersetGroupId: 'g1' },
    ]);
    expect(shouldStartRestAfterSet(list, 0)).toBe(true);
  });

  it('does not start rest mid-superset when next shares group', () => {
    const list = exercises([
      { id: 'a', sortOrder: 0, supersetGroupId: 'g1' },
      { id: 'b', sortOrder: 1, supersetGroupId: 'g1' },
      { id: 'c', sortOrder: 2, supersetGroupId: null },
    ]);
    expect(shouldStartRestAfterSet(list, 0)).toBe(false);
  });

  it('starts rest at end of superset round when next has different group', () => {
    const list = exercises([
      { id: 'a', sortOrder: 0, supersetGroupId: 'g1' },
      { id: 'b', sortOrder: 1, supersetGroupId: 'g1' },
      { id: 'c', sortOrder: 2, supersetGroupId: null },
    ]);
    expect(shouldStartRestAfterSet(list, 1)).toBe(true);
  });

  it('starts rest after last exercise in session', () => {
    const list = exercises([{ id: 'a', sortOrder: 0, supersetGroupId: 'g1' }]);
    expect(shouldStartRestAfterSet(list, 0)).toBe(true);
  });
});

describe('exerciseIndexAfterSetConfirm', () => {
  it('advances index within superset', () => {
    const list = exercises([
      { id: 'a', sortOrder: 0, supersetGroupId: 'g1' },
      { id: 'b', sortOrder: 1, supersetGroupId: 'g1' },
    ]);
    expect(exerciseIndexAfterSetConfirm(list, 0)).toBe(1);
  });

  it('keeps index when rest should start', () => {
    const list = exercises([
      { id: 'a', sortOrder: 0, supersetGroupId: null },
      { id: 'b', sortOrder: 1, supersetGroupId: null },
    ]);
    expect(exerciseIndexAfterSetConfirm(list, 0)).toBe(0);
  });
});

describe('computeRestEndsAt', () => {
  it('adds default rest seconds to now', () => {
    const now = 1_000_000;
    expect(computeRestEndsAt(now)).toBe(now + DEFAULT_REST_SECONDS * 1000);
  });

  it('remainingMsUntilEndsAt uses wall clock not tick count', () => {
    const endsAt = computeRestEndsAt(0, 90);
    expect(remainingMsUntilEndsAt(endsAt, 30_000)).toBe(60_000);
  });
});

describe('formatRestCountdown', () => {
  it('formats as M:SS', () => {
    expect(formatRestCountdown(90_500)).toBe('1:31');
    expect(formatRestCountdown(0)).toBe('0:00');
  });
});
