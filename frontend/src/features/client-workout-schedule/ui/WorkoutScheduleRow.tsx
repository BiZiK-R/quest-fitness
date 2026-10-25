import { useState } from 'react';
import type { components } from '@/shared/api/schema';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { workoutStatusLabel } from '../lib/workout-schedule-labels';
import './WorkoutScheduleRow.css';

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

/**
 * Строка расписания: статус + primary «Начать»; вторичные действия — в sheet «Ещё».
 */
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
  const [moreOpen, setMoreOpen] = useState(false);

  function runAndClose(action: () => void) {
    setMoreOpen(false);
    action();
  }

  return (
    <li className="workout-schedule-row">
      <div className="workout-schedule-row__main">
        <p className="workout-schedule-row__title">
          {formattedScheduledAt}
          {workout.templateName ? ` — ${workout.templateName}` : null}
        </p>
        <p className="workout-schedule-row__meta type-meta type-muted">
          <span className="workout-status-pill">{workoutStatusLabel(workout.status)}</span>
          {workout.isOverdue ? (
            <>
              {' · '}
              <span className="workout-overdue-label">Просрочена</span>
            </>
          ) : null}
        </p>
      </div>

      {showStartAction || showPendingActions ? (
        <div className="workout-schedule-row__actions">
          {showStartAction ? (
            <Button variant="primary" disabled={busy} onClick={onStart}>
              Начать
            </Button>
          ) : null}
          {showPendingActions ? (
            <Button
              variant="secondary"
              disabled={busy}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              Ещё
            </Button>
          ) : null}
        </div>
      ) : null}

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Действия с тренировкой">
        <div className="workout-schedule-row__sheet">
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={() => runAndClose(onReschedule)}
          >
            Перенести
          </Button>
          <Button variant="secondary" fullWidth disabled={busy} onClick={() => runAndClose(onSkip)}>
            Пропустить
          </Button>
          <Button variant="danger" fullWidth disabled={busy} onClick={() => runAndClose(onCancel)}>
            Отменить
          </Button>
        </div>
      </BottomSheet>
    </li>
  );
}
