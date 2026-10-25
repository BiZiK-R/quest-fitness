import type { ReactNode } from 'react';
import { GuildMark } from './GuildMark';
import './EmptyState.css';

export type EmptyStateProps = {
  /** Квестовый заголовок момента: «Гильдия пока собирается». */
  title: string;
  /** Одна строка пояснения приглушённым текстом. */
  description?: ReactNode;
  /** Одно действие — обычно Button. */
  action?: ReactNode;
  /** Водяной знак Гильдии 32px цветом hairline («Скоро»-заглушки). */
  watermark?: boolean;
  /** display — 28/34 (пустые состояния), title — 20/26 (soon-stub внутри экрана). */
  size?: 'display' | 'title';
  /** h1, когда панель — единственный заголовок экрана (soon-stub). */
  headingLevel?: 1 | 2;
  className?: string;
};

/** Крем-панель 16 пустого / «Скоро» состояния: заголовок, строка пояснения, одно действие. */
export function EmptyState({
  title,
  description,
  action,
  watermark = false,
  size = 'display',
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const classes = [
    'ui-empty-state',
    `ui-empty-state--${size}`,
    watermark ? 'ui-empty-state--centered' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      {watermark ? (
        <span className="ui-empty-state__watermark" aria-hidden="true">
          <GuildMark size={32} />
        </span>
      ) : null}
      <Heading className="ui-empty-state__title">{title}</Heading>
      {description ? <p className="ui-empty-state__text">{description}</p> : null}
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </section>
  );
}
