import { WorkoutStatus } from '@prisma/client';
import { getGymTimezone } from '../../shared/timezone/gym-timezone';

/** YYYY-MM-DD calendar key in the given IANA timezone (lexicographic compare). */
export function calendarDateKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** YYYY-MM gym-local month key (AD-17). */
export function calendarMonthKeyInTimeZone(date: Date, timeZone: string): string {
  return calendarDateKeyInTimeZone(date, timeZone).slice(0, 7);
}

/**
 * AD-17: pending workout is overdue when its gym-local calendar day is before gym-local today.
 */
export function computeWorkoutIsOverdue(
  status: WorkoutStatus,
  scheduledAt: Date,
  now: Date = new Date(),
  timeZone: string = getGymTimezone(),
): boolean {
  if (status !== WorkoutStatus.pending) {
    return false;
  }
  const scheduledDay = calendarDateKeyInTimeZone(scheduledAt, timeZone);
  const today = calendarDateKeyInTimeZone(now, timeZone);
  return scheduledDay < today;
}
