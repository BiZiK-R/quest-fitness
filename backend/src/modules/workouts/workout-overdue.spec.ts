import { describe, expect, it } from 'vitest';
import { WorkoutStatus } from '@prisma/client';
import { computeWorkoutIsOverdue } from './workout-overdue.util';

const TZ = 'Europe/Moscow';

describe('computeWorkoutIsOverdue (AD-17)', () => {
  it('returns true for pending scheduled on previous gym-local day', () => {
    const now = new Date('2026-10-02T20:00:00.000Z');
    const scheduledAt = new Date('2026-10-01T10:00:00.000Z');
    expect(computeWorkoutIsOverdue(WorkoutStatus.pending, scheduledAt, now, TZ)).toBe(true);
  });

  it('returns false for pending on same gym-local day', () => {
    const now = new Date('2026-10-02T08:00:00.000Z');
    const scheduledAt = new Date('2026-10-02T06:00:00.000Z');
    expect(computeWorkoutIsOverdue(WorkoutStatus.pending, scheduledAt, now, TZ)).toBe(false);
  });

  it('returns false for pending in the future gym-local day', () => {
    const now = new Date('2026-10-02T08:00:00.000Z');
    const scheduledAt = new Date('2026-10-03T06:00:00.000Z');
    expect(computeWorkoutIsOverdue(WorkoutStatus.pending, scheduledAt, now, TZ)).toBe(false);
  });

  it('returns false for non-pending statuses even when date is past', () => {
    const now = new Date('2026-10-02T08:00:00.000Z');
    const scheduledAt = new Date('2026-09-01T10:00:00.000Z');
    expect(computeWorkoutIsOverdue(WorkoutStatus.attended, scheduledAt, now, TZ)).toBe(false);
    expect(computeWorkoutIsOverdue(WorkoutStatus.skipped, scheduledAt, now, TZ)).toBe(false);
    expect(computeWorkoutIsOverdue(WorkoutStatus.cancelled, scheduledAt, now, TZ)).toBe(false);
  });
});
