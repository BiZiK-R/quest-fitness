import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import type { ComponentProps } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'secondarySession' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = Omit<ComponentProps<'button'>, 'type' | 'color'> & {
  variant?: ButtonVariant;
  /** md — 48px, lg — 56px. По умолчанию primary = lg, остальные = md. */
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Спиннер слева от текста; кнопка блокируется, текст остаётся. */
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

const VARIANT_TO_ANT: Record<
  ButtonVariant,
  Pick<AntButtonProps, 'type' | 'danger' | 'ghost'>
> = {
  primary: { type: 'primary' },
  secondary: { type: 'default' },
  secondarySession: { type: 'default' },
  /** Контурная danger: не конкурирует с primary-красным и читаема на тёмном. */
  danger: { type: 'default', danger: true },
  ghost: { type: 'text' },
};

/**
 * Кнопка Гильдии на базе antd Button.
 * Primary — единственная красная заливка в кадре (DESIGN → Components).
 */
export function Button({
  variant = 'secondary',
  size,
  fullWidth = false,
  loading = false,
  type = 'button',
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const resolvedSize = size ?? (variant === 'primary' ? 'lg' : 'md');
  const ant = VARIANT_TO_ANT[variant];
  const classes = [
    'ui-button',
    variant === 'secondarySession' ? 'ui-button--secondary-session' : null,
    variant === 'danger' ? 'ui-button--danger' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AntButton
      {...ant}
      htmlType={type}
      size={resolvedSize === 'lg' ? 'large' : 'middle'}
      block={fullWidth}
      loading={loading}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {children}
    </AntButton>
  );
}
