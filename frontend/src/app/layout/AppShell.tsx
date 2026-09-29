import type { ReactNode } from 'react';
import { GuildMark } from '@/shared/ui/GuildMark';
import './AppShell.css';

export type AppShellProps = {
  children: ReactNode;
  title?: ReactNode;
};

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <span className="app-shell__mark">
            <GuildMark size={28} />
          </span>
          {title ? <div className="app-shell__title">{title}</div> : null}
        </div>
      </header>
      <div className="app-shell__column">
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
