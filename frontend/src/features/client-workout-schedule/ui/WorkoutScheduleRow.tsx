import type { components } from '@/shared/api/schema';
import { workoutStatusLabel } from '../lib/workout-schedule-labels';

type Workout = components['schemas']['WorkoutDto'];

type Props = {
  workout: Workout;
  formattedScheduledAt: string;
  showStartAction: boolean;
  showPendingActions: boolean;
  busy: boolean;
  onStart: () => void;
  onReschedule: () => void;
  onSkip: () => void;
  onCancel: () => void;
};

export function WorkoutScheduleRow({
  workout,
  formattedScheduledAt,
  showStartAction,
  showPendingActions,
  busy,
  onStart,
  onReschedule,
  onSkip,
  onCancel,
}: Props) {
  return (
    <li>
      {formattedScheduledAt}
      {workout.templateName ? ` — ${workout.templateName}` : null}
      {' · '}
      <span className="workout-status-pill">{workoutStatusLabel(workout.status)}</span>
      {workout.isOverdue ? (
        <>
          {' · '}
          <span className="workout-overdue-label">Просрочена</span>
        </>
      ) : null}
      {showStartAction ? (
        <>
          {' '}
          <button type="button" disabled={busy} aria-label="Начать" onClick={onStart}>
            Начать
          </button>
        </>
      ) : null}
      {showPendingActions ? (
        <>
          {' '}
          <button type="button" disabled={busy} onClick={onReschedule}>
            Перенести
          </button>
          <button type="button" disabled={busy} onClick={onSkip}>
            Пропустить
          </button>
          <button type="button" disabled={busy} onClick={onCancel}>
            Отменить
          </button>
        </>
      ) : null}
    </li>
  );
}
