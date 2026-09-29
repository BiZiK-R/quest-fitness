import type { components } from '@/shared/api/schema';
import {
  WORKOUT_START_STUB_TITLE,
  workoutStatusLabel,
} from '../lib/workout-schedule-labels';

type Workout = components['schemas']['WorkoutDto'];

type Props = {
  workout: Workout;
  formattedScheduledAt: string;
  showStartStub: boolean;
  showPendingActions: boolean;
  busy: boolean;
  onReschedule: () => void;
  onSkip: () => void;
  onCancel: () => void;
};

export function WorkoutScheduleRow({
  workout,
  formattedScheduledAt,
  showStartStub,
  showPendingActions,
  busy,
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
      {showStartStub ? (
        <>
          {' '}
          <button
            type="button"
            disabled
            title={WORKOUT_START_STUB_TITLE}
            aria-label={`Начать — ${WORKOUT_START_STUB_TITLE}`}
          >
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
