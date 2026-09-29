import { createBrowserRouter } from 'react-router-dom';
import { RootRedirect } from '@/pages/home/RootRedirect';
import { LoginPage } from '@/pages/login/LoginPage';
import { CabinetWorkoutsPage } from '@/pages/cabinet/CabinetWorkoutsPage';
import { PoolPage } from '@/pages/pool/PoolPage';

export const appRouter = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/pool', element: <PoolPage /> },
  { path: '/cabinet/workouts', element: <CabinetWorkoutsPage /> },
]);
