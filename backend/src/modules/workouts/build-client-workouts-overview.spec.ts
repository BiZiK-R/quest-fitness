import { WorkoutStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildClientWorkoutsOverview } from './build-client-workouts-overview';

const TZ = 'Europe/Moscow';

type Row = {
  id: string;
  scheduledAt: Date;
  status: WorkoutStatus;
  templateName: string | null;
};

describe('buildClientWorkoutsOverview (AD-17)', () => {
  const now = new Date('2026-03-15T12:00:00.000Z');

  it('sets monthKey and workoutsThisMonth from gym TZ, excludes cancelled', () => {
    const rows: Row[] = [
      {
        id: 'w1',
        scheduledAt: new Date('2026-03-01T10:00:00.000Z'),
        status: WorkoutStatus.attended,
        templateName: 'A',
      },
      {
        id: 'w2',
        scheduledAt: new Date('2026-03-20T10:00:00.000Z'),
        status: WorkoutStatus.pending,
        templateName: 'B',
      },
      {
        id: 'w3',
        scheduledAt: new Date('2026-03-22T10:00:00.000Z'),
        status: WorkoutStatus.cancelled,
        templateName: 'C',
      },
      {
        id: 'w4',
        scheduledAt: new Date('2026-02-15T10:00:00.000Z'),
        status: WorkoutStatus.attended,
        templateName: 'Feb',
      },
    ];

    const dto = buildClientWorkoutsOverview(rows, { now, timeZone: TZ });

    expect(dto.monthKey).toBe('2026-03');
    expect(dto.monthLabel.length).toBeGreaterThan(0);
    expect(dto.workoutsThisMonth).toBe(2);
    expect(dto.isEmpty).toBe(false);
  });

  it('returns isEmpty and empty lists when no workouts', () => {
    const dto = buildClientWorkoutsOverview([], { now, timeZone: TZ });

    expect(dto.isEmpty).toBe(true);
    expect(dto.workoutsThisMonth).toBe(0);
    expect(dto.upcoming).toEqual([]);
    expect(dto.nextScheduled).toBeNull();
    expect(dto.streak).toBe(0);
  });

  it('upcoming includes gym-local today onward, max 5, ordered ASC', () => {
    const rows: Row[] = Array.from({ length: 7 }, (_, i) => ({
      id: `w${i}`,
      scheduledAt: new Date(`2026-03-${16 + i}T09:00:00.000Z`),
      status: WorkoutStatus.pending,
      templateName: `T${i}`,
    }));
    rows.unshift({
      id: 'past',
      scheduledAt: new Date('2026-03-14T09:00:00.000Z'),
      status: WorkoutStatus.pending,
      templateName: 'Past',
    });

    const dto = buildClientWorkoutsOverview(rows, { now, timeZone: TZ });

    expect(dto.upcoming).toHaveLength(5);
    expect(dto.upcoming[0]?.id).toBe('w0');
    expect(dto.upcoming.map((u) => u.id)).toEqual(['w0', 'w1', 'w2', 'w3', 'w4']);
  });

  it('nextScheduled is earliest pending by scheduledAt', () => {
    const rows: Row[] = [
      {
        id: 'late',
        scheduledAt: new Date('2026-03-25T09:00:00.000Z'),
        status: WorkoutStatus.pending,
        templateName: 'Late',
      },
      {
        id: 'early',
        scheduledAt: new Date('2026-03-10T09:00:00.000Z'),
        status: WorkoutStatus.pending,
        templateName: 'Early',
      },
      {
        id: 'attended',
        scheduledAt: new Date('2026-03-05T09:00:00.000Z'),
        status: WorkoutStatus.attended,
        templateName: 'Done',
      },
    ];

    const dto = buildClientWorkoutsOverview(rows, { now, timeZone: TZ });

    expect(dto.nextScheduled?.id).toBe('early');
    expect(dto.nextScheduled?.isOverdue).toBe(true);
  });

  it('includes streak from full history (5 attended + 5 pending → 5)', () => {
    const attended = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id, i) => ({
      id,
      scheduledAt: new Date(`2026-02-0${i + 1}T09:00:00.000Z`),
      status: WorkoutStatus.attended,
      templateName: null,
    }));
    const pending = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id, i) => ({
      id,
      scheduledAt: new Date(`2026-03-${10 + i}T09:00:00.000Z`),
      status: WorkoutStatus.pending,
      templateName: null,
    }));

    const dto = buildClientWorkoutsOverview([...attended, ...pending], { now, timeZone: TZ });

    expect(dto.streak).toBe(5);
  });

  it('includes streak 0 after skip with no attended recovery', () => {
    const rows: Row[] = [
      {
        id: '1',
        scheduledAt: new Date('2026-03-01T09:00:00.000Z'),
        status: WorkoutStatus.attended,
        templateName: null,
      },
      {
        id: '2',
        scheduledAt: new Date('2026-03-02T09:00:00.000Z'),
        status: WorkoutStatus.skipped,
        templateName: null,
      },
      {
        id: '3',
        scheduledAt: new Date('2026-03-20T09:00:00.000Z'),
        status: WorkoutStatus.pending,
        templateName: null,
      },
    ];

    const dto = buildClientWorkoutsOverview(rows, { now, timeZone: TZ });

    expect(dto.streak).toBe(0);
  });
});
