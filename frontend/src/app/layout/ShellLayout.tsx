import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';

export function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
