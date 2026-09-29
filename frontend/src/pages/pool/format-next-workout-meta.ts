import type { components } from '@/shared/api/schema';
import { workoutStatusLabel } from '@/features/client-workout-schedule/lib/workout-schedule-labels';

type NextWorkout = NonNullable<components['schemas']['ClientProfileDto']['nextWorkout']>;

/** Pool row subtitle from BFF nextWorkout (no browser-TZ overdue recompute). */
export function formatNextWorkoutMeta(nextWorkout: NextWorkout): string {
  const d = new Date(nextWorkout.scheduledAt);
  const datePart = Number.isNaN(d.getTime())
    ? nextWorkout.scheduledAt
    : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  const overduePart = nextWorkout.isOverdue ? ' · Просрочена' : '';
  return `${datePart} · ${workoutStatusLabel(nextWorkout.status)}${overduePart}`;
}
