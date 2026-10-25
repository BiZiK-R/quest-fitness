import type { ReactNode } from 'react';
import { Button } from './Button';
import { LockIcon } from './icons';
import './LockBadge.css';

export type LockBadgeProps = {
  /** Имя занявшего Тренера словом: «Артём». */
  holderName: string;
  className?: string;
};

/**
 * Пилюля 24px «замок + имя Тренера» (DESIGN → lock-badge). В строке Пула — только метка, не кнопка.
 */
export function LockBadge({ holderName, className }: LockBadgeProps) {
  const classes = ['ui-lock-badge', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <span className="ui-lock-badge__icon" aria-hidden="true">
        <LockIcon size={16} />
      </span>
      <span className="ui-visually-hidden">Клиента ведёт </span>
      {holderName}
    </span>
  );
}

export type LockRowProps = {
  /** id для `aria-describedby` у заблокированных действий карточки. */
  id?: string;
  holderName: string;
  /** Строка TTL, которую тикает страница: «Освободится через 12 мин.» */
  ttlText?: ReactNode;
  /** Показывается занявшему Тренеру и Админу. Подтверждение — ConfirmDialog на странице. */
  onRelease?: () => void;
  releasing?: boolean;
};

/**
 * Развёрнутая Занятость в карточке Клиента: бейдж, «Клиента ведёт …», TTL и «Освободить» (danger).
 * Живой регион polite — TTL объявляется без перехвата фокуса.
 */
export function LockRow({ id, holderName, ttlText, onRelease, releasing = false }: LockRowProps) {
  return (
    <div id={id} className="ui-lock-row">
      <div className="ui-lock-row__text" aria-live="polite">
        <LockBadge holderName={holderName} />
        <p className="ui-lock-row__line">
          Клиента ведёт {holderName}.{ttlText ? <> {ttlText}</> : null}
        </p>
      </div>
      {onRelease ? (
        <Button variant="danger" loading={releasing} onClick={onRelease}>
          Освободить
        </Button>
      ) : null}
    </div>
  );
}
