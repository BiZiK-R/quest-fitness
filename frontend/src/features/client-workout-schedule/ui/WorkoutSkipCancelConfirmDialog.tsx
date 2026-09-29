import { useId } from 'react';

export const WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE =
  'Стрик сбросится. Чтобы сдвинуть дату — используйте Перенести.';

type Props = {
  action: 'skip' | 'cancel';
  onConfirm: () => void;
  onReschedule: () => void;
  onDismiss: () => void;
};

export function WorkoutSkipCancelConfirmDialog({
  action,
  onConfirm,
  onReschedule,
  onDismiss,
}: Props) {
  const titleId = useId();
  const confirmLabel = action === 'skip' ? 'Пропустить' : 'Отменить';

  return (
    <div className="workout-skip-cancel-dialog" role="dialog" aria-labelledby={titleId}>
      <h3 id={titleId}>{confirmLabel} тренировку?</h3>
      <p>{WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE}</p>
      <div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onReschedule}>
          Перенести
        </button>
        <button type="button" onClick={onDismiss}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
