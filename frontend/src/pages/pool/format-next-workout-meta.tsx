import type { ReactNode } from 'react';
import type { components } from '@/shared/api/schema';
import { workoutStatusLabel } from '@/features/client-workout-schedule/lib/workout-schedule-labels';
import { formatWorkoutDate } from '@/shared/lib/format-workout-date';

type NextWorkout = NonNullable<components['schemas']['ClientProfileDto']['nextWorkout']>;

/**
 * Мета строки Пула: `<b>Статус</b> · дата` по nextWorkout из BFF.
 * «просрочена» берётся из isOverdue сервера — браузерная TZ не пересчитывает.
 */
export function formatNextWorkoutMeta(nextWorkout: NextWorkout, now?: Date): ReactNode {
  const date = formatWorkoutDate(nextWorkout.scheduledAt, now);
  return (
    <>
      <b>{workoutStatusLabel(nextWorkout.status)}</b>
      {nextWorkout.isOverdue ? ' · просрочена' : null} · {date}
    </>
  );
}
