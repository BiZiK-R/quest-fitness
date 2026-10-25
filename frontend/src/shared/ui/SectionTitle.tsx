import type { ReactNode } from 'react';
import './SectionTitle.css';

export type SectionTitleProps = {
  children: ReactNode;
  /** Уровень заголовка; визуально всегда title 20/26. */
  as?: 'h2' | 'h3';
  /** Действие справа от заголовка (ghost-кнопка, ссылка). */
  action?: ReactNode;
  id?: string;
};

/** Заголовок смыслового блока: 24 над блоком, 12 до содержимого (DESIGN → вертикальный ритм). */
export function SectionTitle({ children, as: Heading = 'h2', action, id }: SectionTitleProps) {
  return (
    <div className="ui-section-title">
      <Heading id={id} className="ui-section-title__text">
        {children}
      </Heading>
      {action ? <div className="ui-section-title__action">{action}</div> : null}
    </div>
  );
}
