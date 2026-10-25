import { Input } from 'antd';
import { useId, type ComponentProps, type ReactNode } from 'react';
import './Field.css';

export type TextAreaProps = Omit<ComponentProps<'textarea'>, 'size' | 'ref'> & {
  label: string;
  hideLabel?: boolean;
  error?: string | null;
  hint?: ReactNode;
};

/** Многострочное поле на базе antd Input.TextArea. */
export function TextArea({
  label,
  hideLabel = false,
  error,
  hint,
  className,
  id,
  rows = 3,
  ...textareaProps
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  const classes = ['ui-field', 'ui-field--textarea', error ? 'ui-field--invalid' : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label className={hideLabel ? 'ui-visually-hidden' : 'ui-field__label'} htmlFor={inputId}>
        {label}
      </label>
      <Input.TextArea
        id={inputId}
        rows={rows}
        status={error ? 'error' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="ui-field__control"
        {...textareaProps}
      />
      {hint ? (
        <p id={hintId} className="ui-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="ui-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
