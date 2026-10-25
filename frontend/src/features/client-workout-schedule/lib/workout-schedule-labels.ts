import type { components } from '@/shared/api/schema';
import { WORKOUT_STATUS_LABEL, type WorkoutStatus as PillStatus } from '@/shared/ui/StatusPill';

type WorkoutStatus = components['schemas']['WorkoutDto']['status'];

const PILL_STATUS: Record<WorkoutStatus, PillStatus> = {
  pending: 'waiting',
  attended: 'arrived',
  skipped: 'missed',
  cancelled: 'cancelled',
};

/** Статус API → вариант StatusPill (Ожидание / Пришёл / Пропущена / Отменена). */
export function toPillStatus(status: WorkoutStatus): PillStatus {
  return PILL_STATUS[status];
}

/** Каноническое слово статуса (EXPERIENCE → Voice and Tone), без красного цвета. */
export function workoutStatusLabel(status: WorkoutStatus): string {
  return WORKOUT_STATUS_LABEL[toPillStatus(status)];
}
