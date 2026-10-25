import type { ReactNode } from 'react';
import { GuildMark } from './GuildMark';
import './AppShell.css';

export type AppShellSurface = 'light' | 'session';

export type AppShellProps = {
  children: ReactNode;
  /** Заголовок экрана — единственный h1 страницы, живёт в appbar. Без него — бренд «Quest Fitness». */
  title?: ReactNode;
  /** Слот слева вместо знака Гильдии, обычно IconButton «Назад». */
  leading?: ReactNode;
  /** Слот справа: IconButton меню / закрыть. */
  action?: ReactNode;
  /** Закреплённый низ колонки: BottomCta или tab-bar. Место под контентом резервируется само. */
  bottom?: ReactNode;
  surface?: AppShellSurface;
};

/**
 * Каркас экрана: appbar 56px + контент + закреплённый низ в одной колонке ≤ 640px.
 * На ≥ 768px колонка стоит «телефоном на столе»: hairline-рамка на фоне surface-sunken.
 */
export function AppShell({
  children,
  title,
  leading,
  action,
  bottom,
  surface = 'light',
}: AppShellProps) {
  const rootClasses = [
    'ui-app-shell',
    surface === 'session' ? 'ui-app-shell--session ui-surface-session' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div className="ui-app-shell__frame">
        <header className={`ui-app-shell__appbar${leading ? ' ui-app-shell__appbar--leading' : ''}`}>
          {leading ?? (
            <span className="ui-app-shell__mark">
              <GuildMark size={24} />
            </span>
          )}
          {title ? (
            <h1 className="ui-app-shell__title">{title}</h1>
          ) : (
            <span className="ui-app-shell__brand">Quest Fitness</span>
          )}
          {action ? <div className="ui-app-shell__action">{action}</div> : null}
        </header>
        <main className="ui-app-shell__main">{children}</main>
        {bottom ? <div className="ui-app-shell__bottom">{bottom}</div> : null}
      </div>
    </div>
  );
}
