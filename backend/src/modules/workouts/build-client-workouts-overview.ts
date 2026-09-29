import { WorkoutStatus } from '@prisma/client';
import { formatGymMonthLabel } from '../../shared/timezone/gym-timezone';
import {
  calendarDateKeyInTimeZone,
  calendarMonthKeyInTimeZone,
  computeWorkoutIsOverdue,
} from './workout-overdue.util';
import { ClientWorkoutsOverviewDto, WorkoutOverviewItemDto } from './dto/client-workouts-overview.dto';

const UPCOMING_LIMIT = 5;

export type OverviewWorkoutRow = {
  id: string;
  scheduledAt: Date;
  status: WorkoutStatus;
  templateName: string | null;
};

export type BuildClientWorkoutsOverviewOptions = {
  now?: Date;
  timeZone: string;
};

function toOverviewItem(
  row: OverviewWorkoutRow,
  now: Date,
  timeZone: string,
): WorkoutOverviewItemDto {
  return {
    id: row.id,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    isOverdue: computeWorkoutIsOverdue(row.status, row.scheduledAt, now, timeZone),
    templateName: row.templateName,
  };
}

/**
 * Pure overview fold for client workouts (AD-17 gym-local calendar).
 */
export function buildClientWorkoutsOverview(
  rows: OverviewWorkoutRow[],
  options: BuildClientWorkoutsOverviewOptions,
): ClientWorkoutsOverviewDto {
  const now = options.now ?? new Date();
  const { timeZone } = options;
  const monthKey = calendarMonthKeyInTimeZone(now, timeZone);
  const todayKey = calendarDateKeyInTimeZone(now, timeZone);

  const sorted = [...rows].sort((a, b) => {
    const diff = a.scheduledAt.getTime() - b.scheduledAt.getTime();
    if (diff !== 0) {
      return diff;
    }
    return a.id.localeCompare(b.id);
  });

  const isEmpty = sorted.length === 0;

  const workoutsThisMonth = sorted.filter(
    (row) =>
      row.status !== WorkoutStatus.cancelled &&
      calendarMonthKeyInTimeZone(row.scheduledAt, timeZone) === monthKey,
  ).length;

  const upcoming = sorted
    .filter((row) => calendarDateKeyInTimeZone(row.scheduledAt, timeZone) >= todayKey)
    .slice(0, UPCOMING_LIMIT)
    .map((row) => toOverviewItem(row, now, timeZone));

  const pendingSorted = sorted.filter((row) => row.status === WorkoutStatus.pending);
  const nextScheduled = pendingSorted[0]
    ? toOverviewItem(pendingSorted[0], now, timeZone)
    : null;

  return {
    monthKey,
    monthLabel: formatGymMonthLabel(monthKey, timeZone),
    workoutsThisMonth,
    upcoming,
    nextScheduled,
    isEmpty,
  };
}
