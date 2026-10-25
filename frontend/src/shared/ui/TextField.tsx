import { Input } from 'antd';
import { useId, type ComponentProps, type ReactNode } from 'react';
import './Field.css';

export type TextFieldVariant = 'default' | 'search';

export type TextFieldProps = Omit<
  ComponentProps<'input'>,
  'size' | 'prefix' | 'suffix' | 'ref'
> & {
  label: string;
  hideLabel?: boolean;
  variant?: TextFieldVariant;
  error?: string | null;
  hint?: ReactNode;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
};

/**
 * Поле ввода на базе antd Input: метка, hint, ошибка ink-error (не CTA-красный).
 */
export function TextField({
  label,
  hideLabel = false,
  variant = 'default',
  error,
  hint,
  leadingIcon,
  trailing,
  className,
  id,
  type,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  const classes = [
    'ui-field',
    `ui-field--${variant}`,
    error ? 'ui-field--invalid' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label className={hideLabel ? 'ui-visually-hidden' : 'ui-field__label'} htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        type={type}
        size={variant === 'search' ? 'small' : 'large'}
        status={error ? 'error' : undefined}
        prefix={leadingIcon ?? undefined}
        suffix={trailing ?? undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="ui-field__control"
        {...inputProps}
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
