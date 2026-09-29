import { createBrowserRouter } from 'react-router-dom';
import { ShellLayout } from '@/app/layout/ShellLayout';
import { RootRedirect } from '@/pages/home/RootRedirect';
import { LoginPage } from '@/pages/login/LoginPage';
import { CabinetWorkoutsPage } from '@/pages/cabinet/CabinetWorkoutsPage';
import { PoolPage } from '@/pages/pool/PoolPage';
import { ClientCardPage } from '@/pages/client-card/ClientCardPage';
import { InviteRegisterPage } from '@/pages/invite/InviteRegisterPage';
import { AdminTrainersPage } from '@/pages/admin-trainers/AdminTrainersPage';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { TemplatesPage } from '@/pages/templates/TemplatesPage';
import { MacrocyclesPage } from '@/pages/macrocycles/MacrocyclesPage';
import { SessionPage } from '@/pages/session/SessionPage';

export const appRouter = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <ShellLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/invite/:token', element: <InviteRegisterPage /> },
      { path: '/pool', element: <PoolPage /> },
      { path: '/catalog', element: <CatalogPage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/macrocycles', element: <MacrocyclesPage /> },
      { path: '/admin/trainers', element: <AdminTrainersPage /> },
      { path: '/clients/:id', element: <ClientCardPage /> },
      { path: '/sessions/:sessionId', element: <SessionPage /> },
      { path: '/cabinet/workouts', element: <CabinetWorkoutsPage /> },
    ],
  },
]);
