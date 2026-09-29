import { useCallback, type KeyboardEvent } from 'react';
import './SessionSetLogger.css';

export type SessionSetLoggerValues = {
  weightKg: number;
  reps: number;
  rpe: number;
};

type Props = {
  values: SessionSetLoggerValues;
  disabled: boolean;
  onChange: (values: SessionSetLoggerValues) => void;
  onConfirm: () => void;
};

function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Inline set entry with steppers; Enter confirms only when focus is inside the logger.
 */
export function SessionSetLogger({ values, disabled, onChange, onConfirm }: Props) {
  const bump = useCallback(
    (field: keyof SessionSetLoggerValues, delta: number) => {
      const next = { ...values, [field]: roundWeight(values[field] + delta) };
      if (next[field] < 0) {
        next[field] = 0;
      }
      onChange(next);
    },
    [onChange, values],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !disabled) {
      event.preventDefault();
      onConfirm();
    }
  };

  return (
    <div
      className="session-set-logger"
      data-testid="session-set-logger"
      onKeyDown={handleKeyDown}
    >
      <p className="session-set-logger__label">Подход — сейчас</p>
      <div className="session-set-logger__fields">
        <FieldStepper
          label="Вес, кг"
          value={values.weightKg}
          disabled={disabled}
          onMinus={() => bump('weightKg', -2.5)}
          onPlus={() => bump('weightKg', 2.5)}
          testId="session-set-weight"
        />
        <FieldStepper
          label="Повторы"
          value={values.reps}
          disabled={disabled}
          onMinus={() => bump('reps', -1)}
          onPlus={() => bump('reps', 1)}
          testId="session-set-reps"
        />
        <FieldStepper
          label="RPE"
          value={values.rpe}
          disabled={disabled}
          onMinus={() => bump('rpe', -0.5)}
          onPlus={() => bump('rpe', 0.5)}
          testId="session-set-rpe"
        />
      </div>
      <button
        type="button"
        className="session-set-logger__confirm"
        disabled={disabled}
        data-testid="session-set-confirm"
        onClick={onConfirm}
      >
        Подтвердить
      </button>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: number;
  disabled: boolean;
  onMinus: () => void;
  onPlus: () => void;
  testId: string;
};

function FieldStepper({ label, value, disabled, onMinus, onPlus, testId }: FieldProps) {
  return (
    <div className="session-set-logger__field" data-testid={testId}>
      <span className="session-set-logger__field-label">{label}</span>
      <div className="session-set-logger__stepper">
        <button type="button" disabled={disabled} aria-label={`${label} меньше`} onClick={onMinus}>
          −
        </button>
        <span className="session-set-logger__value tabular-nums">{value}</span>
        <button type="button" disabled={disabled} aria-label={`${label} больше`} onClick={onPlus}>
          +
        </button>
      </div>
    </div>
  );
}
