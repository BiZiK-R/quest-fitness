import { describe, expect, it } from 'vitest';
import { WorkoutStatus } from '@prisma/client';
import { computeStreak, type WorkoutStreakInput } from './compute-streak';

function w(
  id: string,
  scheduledAt: string,
  status: WorkoutStreakInput['status'],
): WorkoutStreakInput {
  return { id, scheduledAt, status };
}

describe('computeStreak (AD-16 / FR-20)', () => {
  it('counts attended with pending transparent (5 attended + 5 pending → 5)', () => {
    const workouts: WorkoutStreakInput[] = [
      ...['a1', 'a2', 'a3', 'a4', 'a5'].map((id, i) =>
        w(id, `2026-10-0${i + 1}T10:00:00.000Z`, WorkoutStatus.attended),
      ),
      ...['p1', 'p2', 'p3', 'p4', 'p5'].map((id, i) =>
        w(id, `2026-10-${10 + i}T10:00:00.000Z`, WorkoutStatus.pending),
      ),
    ];
    expect(computeStreak(workouts)).toBe(5);
  });

  it('resets to 0 after skipped in history', () => {
    const workouts: WorkoutStreakInput[] = [
      w('1', '2026-10-01T10:00:00.000Z', WorkoutStatus.attended),
      w('2', '2026-10-02T10:00:00.000Z', WorkoutStatus.attended),
      w('3', '2026-10-03T10:00:00.000Z', WorkoutStatus.attended),
      w('4', '2026-10-04T10:00:00.000Z', WorkoutStatus.skipped),
      w('5', '2026-10-05T10:00:00.000Z', WorkoutStatus.pending),
    ];
    expect(computeStreak(workouts)).toBe(0);
  });

  it('resets to 0 after cancelled in history', () => {
    const workouts: WorkoutStreakInput[] = [
      w('1', '2026-10-01T10:00:00.000Z', WorkoutStatus.attended),
      w('2', '2026-10-02T10:00:00.000Z', WorkoutStatus.cancelled),
    ];
    expect(computeStreak(workouts)).toBe(0);
  });

  it('leaves streak unchanged when only pending follows attended', () => {
    const workouts: WorkoutStreakInput[] = [
      w('1', '2026-10-01T10:00:00.000Z', WorkoutStatus.attended),
      w('2', '2026-10-02T10:00:00.000Z', WorkoutStatus.attended),
      w('3', '2026-10-03T10:00:00.000Z', WorkoutStatus.pending),
      w('4', '2026-10-04T10:00:00.000Z', WorkoutStatus.pending),
    ];
    expect(computeStreak(workouts)).toBe(2);
  });

  it('ramps 0 → 2 after reset on two consecutive attended', () => {
    const workouts: WorkoutStreakInput[] = [
      w('1', '2026-10-01T10:00:00.000Z', WorkoutStatus.skipped),
      w('2', '2026-10-02T10:00:00.000Z', WorkoutStatus.attended),
      w('3', '2026-10-03T10:00:00.000Z', WorkoutStatus.attended),
    ];
    expect(computeStreak(workouts)).toBe(2);
  });

  it('adds +1 per attended after ramp (third attended → 3)', () => {
    const workouts: WorkoutStreakInput[] = [
      w('1', '2026-10-01T10:00:00.000Z', WorkoutStatus.cancelled),
      w('2', '2026-10-02T10:00:00.000Z', WorkoutStatus.attended),
      w('3', '2026-10-03T10:00:00.000Z', WorkoutStatus.attended),
      w('4', '2026-10-04T10:00:00.000Z', WorkoutStatus.attended),
    ];
    expect(computeStreak(workouts)).toBe(3);
  });

  it('sorts by scheduledAt ASC then id ASC', () => {
    const workouts: WorkoutStreakInput[] = [
      w('b', '2026-10-02T10:00:00.000Z', WorkoutStatus.attended),
      w('a', '2026-10-01T10:00:00.000Z', WorkoutStatus.attended),
    ];
    expect(computeStreak(workouts)).toBe(2);
  });
});
