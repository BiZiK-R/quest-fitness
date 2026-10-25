import { Button as AntButton } from 'antd';
import type { ComponentProps, ReactNode } from 'react';
import './IconButton.css';

export type IconButtonProps = Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label' | 'type' | 'color'
> & {
  label: string;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

/** Квадратная 48×48 на базе antd Button type=text. */
export function IconButton({
  label,
  children,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = ['ui-icon-button', className].filter(Boolean).join(' ');

  return (
    <AntButton
      type="text"
      htmlType={type}
      aria-label={label}
      title={label}
      className={classes}
      {...rest}
    >
      {children}
    </AntButton>
  );
}
