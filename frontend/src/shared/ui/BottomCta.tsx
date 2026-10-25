import type { ReactNode } from 'react';
import './BottomCta.css';

export type BottomCtaProps = {
  /** Главное действие — обычно `<Button variant="primary" fullWidth>`. */
  primary: ReactNode;
  /** Опциональное второе действие справа (раскладка 60/40), например «Перенести». */
  secondary?: ReactNode;
  surface?: 'light' | 'session';
};

/**
 * Закреплённая нижняя полоса действия (DESIGN → bottom-cta).
 * Кладётся в слот `bottom` у AppShell: там она «липнет» к низу колонки и сама резервирует место.
 */
export function BottomCta({ primary, secondary, surface = 'light' }: BottomCtaProps) {
  const classes = [
    'ui-bottom-cta',
    surface === 'session' ? 'ui-bottom-cta--session' : null,
    secondary ? 'ui-bottom-cta--pair' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="ui-bottom-cta__primary">{primary}</div>
      {secondary ? <div className="ui-bottom-cta__secondary">{secondary}</div> : null}
    </div>
  );
}
