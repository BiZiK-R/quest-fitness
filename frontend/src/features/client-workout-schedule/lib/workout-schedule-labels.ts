import type { components } from '@/shared/api/schema';

type WorkoutStatus = components['schemas']['WorkoutDto']['status'];

const STATUS_LABELS: Record<WorkoutStatus, string> = {
  pending: 'Ожидание',
  attended: 'Пришёл',
  skipped: 'Пропущена',
  cancelled: 'Отменена',
};

/** User-facing Russian status pill text (UX-DR9: primary text, no red status coloring). */
export function workoutStatusLabel(status: WorkoutStatus): string {
  return STATUS_LABELS[status];
}

