import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/app/layout/ShellLayout';
import { RootRedirect } from '@/pages/home/RootRedirect';
import { LoginPage } from '@/pages/login/LoginPage';
import { CabinetWorkoutsPage } from '@/pages/cabinet/CabinetWorkoutsPage';
import { PoolPage } from '@/pages/pool/PoolPage';
import { InviteRegisterPage } from '@/pages/invite/InviteRegisterPage';

export const appRouter = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <ShellLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/invite/:token', element: <InviteRegisterPage /> },
      { path: '/pool', element: <PoolPage /> },
      { path: '/cabinet/workouts', element: <CabinetWorkoutsPage /> },
    ],
  },
]);
