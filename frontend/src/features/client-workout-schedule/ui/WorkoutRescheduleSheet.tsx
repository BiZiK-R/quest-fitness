import { useId, useState } from 'react';

type Props = {
  initialScheduledAtIso: string;
  busy: boolean;
  onSubmit: (scheduledAtIso: string) => void;
  onDismiss: () => void;
};

/** Formats ISO instant for datetime-local input in local timezone. */
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WorkoutRescheduleSheet({
  initialScheduledAtIso,
  busy,
  onSubmit,
  onDismiss,
}: Props) {
  const titleId = useId();
  const inputId = useId();
  const [scheduledLocal, setScheduledLocal] = useState(() =>
    isoToDatetimeLocal(initialScheduledAtIso),
  );

  return (
    <div className="workout-reschedule-sheet" role="dialog" aria-labelledby={titleId}>
      <h3 id={titleId}>Перенести тренировку</h3>
      <div>
        <label htmlFor={inputId}>Новая дата и время</label>
        <input
          id={inputId}
          type="datetime-local"
          value={scheduledLocal}
          disabled={busy}
          onChange={(e) => setScheduledLocal(e.target.value)}
        />
      </div>
      <div>
        <button
          type="button"
          disabled={busy || !scheduledLocal}
          onClick={() => onSubmit(new Date(scheduledLocal).toISOString())}
        >
          Сохранить
        </button>
        <button type="button" disabled={busy} onClick={onDismiss}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
