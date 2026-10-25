import type { ReactNode } from 'react';
import { IconButton } from '@/shared/ui/IconButton';
import { ChevronRightIcon, CloseIcon } from '@/shared/ui/icons';
import './OrderedListRow.css';

export type OrderedListRowProps = {
  title: ReactNode;
  meta?: ReactNode;
  /** Позиция в списке (0…count-1) — выключает «выше» у первой и «ниже» у последней строки. */
  index: number;
  count: number;
  /** Имя строки для подписей кнопок: «Поднять „Жим“». */
  itemLabel: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  /** Тап по строке (настройка подходов). Без него строка не кликабельна. */
  onOpen?: () => void;
};

/**
 * Строка конструктора (Шаблон, Макроцикл) внутри ListCard: название + meta и кнопки
 * «выше / ниже / убрать» вместо drag-and-drop (EXPERIENCE → переупорядочивание).
 */
export function OrderedListRow({
  title,
  meta,
  index,
  count,
  itemLabel,
  onMove,
  onRemove,
  onOpen,
}: OrderedListRowProps) {
  const content = (
    <span className="ui-list-row__main">
      <span className="ui-list-row__title">{title}</span>
      {meta ? <span className="ui-list-row__meta">{meta}</span> : null}
    </span>
  );

  return (
    <li className="ui-list-row__item">
      <div className="ordered-list-row">
        {onOpen ? (
          <button
            type="button"
            className="ui-list-row ui-list-row--interactive ordered-list-row__main"
            aria-label={`Открыть «${itemLabel}»`}
            onClick={onOpen}
          >
            {content}
            <span className="ui-list-row__trailing" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
        ) : (
          <div className="ui-list-row ordered-list-row__main">{content}</div>
        )}
        <div className="ordered-list-row__controls">
          <IconButton
            label={`Поднять «${itemLabel}»`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronRightIcon className="ordered-list-row__arrow--up" />
          </IconButton>
          <IconButton
            label={`Опустить «${itemLabel}»`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ChevronRightIcon className="ordered-list-row__arrow--down" />
          </IconButton>
          <IconButton label={`Убрать «${itemLabel}»`} onClick={onRemove}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>
    </li>
  );
}
