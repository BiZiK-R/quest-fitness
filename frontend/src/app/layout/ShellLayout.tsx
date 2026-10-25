import { Outlet } from 'react-router-dom';
import { AppShell } from '@/shared/ui/AppShell';
import { useShellHandle } from './shell-handle';

/**
 * Общий каркас маршрутов. Статичные экраны получают title/surface из `handle`;
 * экраны с `handle.ownShell` рендерят `<AppShell>` сами.
 */
export function ShellLayout() {
  const { title, surface, ownShell } = useShellHandle();

  if (ownShell) {
    return <Outlet />;
  }

  return (
    <AppShell title={title} surface={surface}>
      <Outlet />
    </AppShell>
  );
}
