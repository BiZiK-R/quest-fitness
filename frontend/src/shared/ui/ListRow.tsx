import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './icons';
import './ListRow.css';

export type ListRowProps = {
  title: ReactNode;
  /** 13/18 muted; статус выделяйте `<b>`: `<><b>Ожидание</b> · сегодня 19:00</>`. */
  meta?: ReactNode;
  /** end — мета справа (Пул клиентов), below — под заголовком (длинные подписи). */
  metaPlacement?: 'end' | 'below';
  /** Бейдж в правом верхнем углу строки (LockBadge, StatusPill). */
  badge?: ReactNode;
  /** Иконка 24px слева (меню тренера). */
  leading?: ReactNode;
  /**
   * Хвост строки. В кликабельной строке по умолчанию — шеврон «можно открыть»
   * (передать `trailing={null}`, чтобы скрыть).
   */
  trailing?: ReactNode | null;
  /** Строка-ссылка (react-router). */
  to?: string;
  /** Строка-кнопка; вместе с `to` — доп. обработчик клика по ссылке (например, закрыть меню). */
  onClick?: () => void;
  /** Явное доступное имя, если текст строки слишком длинный. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Строка списка min-height 56 (DESIGN → client-row). Рендерится как `<li>` внутри `ListCard`.
 * Кликабельная через `to` (Link) или `onClick` (button); hover — только на `(hover: hover)`.
 */
export function ListRow({
  title,
  meta,
  metaPlacement = 'end',
  badge,
  leading,
  trailing,
  to,
  onClick,
  ariaLabel,
  className,
}: ListRowProps) {
  const isInteractive = Boolean(to || onClick);
  const hasEndColumn = Boolean(badge || (meta && metaPlacement === 'end'));
  const resolvedTrailing =
    trailing === undefined && isInteractive ? (
      <ChevronRightIcon />
    ) : (
      trailing
    );
  const classes = [
    'ui-list-row',
    isInteractive ? 'ui-list-row--interactive' : null,
    badge ? 'ui-list-row--with-badge' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leading ? (
        <span className="ui-list-row__leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <span className="ui-list-row__main">
        <span className="ui-list-row__title">{title}</span>
        {meta && metaPlacement === 'below' ? (
          <span className="ui-list-row__meta">{meta}</span>
        ) : null}
      </span>
      {hasEndColumn ? (
        <span className="ui-list-row__end">
          {badge}
          {meta && metaPlacement === 'end' ? (
            <span className="ui-list-row__meta ui-list-row__meta--end">{meta}</span>
          ) : null}
        </span>
      ) : null}
      {resolvedTrailing ? (
        <span className="ui-list-row__trailing" aria-hidden="true">
          {resolvedTrailing}
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <li className="ui-list-row__item">
        <Link to={to} className={classes} aria-label={ariaLabel} onClick={onClick}>
          {content}
        </Link>
      </li>
    );
  }

  if (onClick) {
    return (
      <li className="ui-list-row__item">
        <button type="button" className={classes} aria-label={ariaLabel} onClick={onClick}>
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className="ui-list-row__item">
      <div className={classes}>{content}</div>
    </li>
  );
}
