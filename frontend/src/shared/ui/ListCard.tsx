import type { ReactNode } from 'react';
import './ListCard.css';

export type ListCardProps = {
  children: ReactNode;
  /** Доступное имя списка, например «Клиенты зала». */
  label?: string;
  className?: string;
};

/** Белая карточка-список radius 12 с hairline-разделителями между `ListRow`. */
export function ListCard({ children, label, className }: ListCardProps) {
  const classes = ['ui-list-card', className].filter(Boolean).join(' ');
  return (
    <ul className={classes} aria-label={label}>
      {children}
    </ul>
  );
}
