import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ShellLayout } from '@/app/layout/ShellLayout';
import { CabinetLayout } from '@/app/layout/CabinetLayout';
import type { ShellHandle } from '@/app/layout/shell-handle';
import { RootRedirect } from '@/pages/home/RootRedirect';
import { LoginPage } from '@/pages/login/LoginPage';
import { CabinetWorkoutsPage } from '@/pages/cabinet/CabinetWorkoutsPage';
import { CabinetAnalyticsSoonPage } from '@/pages/cabinet/CabinetAnalyticsSoonPage';
import { CabinetNutritionSoonPage } from '@/pages/cabinet/CabinetNutritionSoonPage';
import { CabinetMeasurementsSoonPage } from '@/pages/cabinet/CabinetMeasurementsSoonPage';
import { CabinetAchievementsSoonPage } from '@/pages/cabinet/CabinetAchievementsSoonPage';
import { CabinetMembershipSoonPage } from '@/pages/cabinet/CabinetMembershipSoonPage';
import { AdminPanelSoonPage } from '@/pages/admin-panel/AdminPanelSoonPage';
import { PoolPage } from '@/pages/pool/PoolPage';
import { ClientCardPage } from '@/pages/client-card/ClientCardPage';
import { InviteRegisterPage } from '@/pages/invite/InviteRegisterPage';
import { AdminTrainersPage } from '@/pages/admin-trainers/AdminTrainersPage';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { TemplatesPage } from '@/pages/templates/TemplatesPage';
import { MacrocyclesPage } from '@/pages/macrocycles/MacrocyclesPage';
import { SessionPage } from '@/pages/session/SessionPage';
import { SessionSummaryPage } from '@/pages/session/SessionSummaryPage';
import { CabinetDiaryPage } from '@/pages/diary/CabinetDiaryPage';
import { CabinetDiaryDetailPage } from '@/pages/diary/CabinetDiaryDetailPage';
import { TrainerClientDiaryPage } from '@/pages/diary/TrainerClientDiaryPage';
import { TrainerClientDiaryDetailPage } from '@/pages/diary/TrainerClientDiaryDetailPage';

/** Каждая страница рендерит `<AppShell>` сама: у неё свои title/action/bottom. */
const ownShell = { ownShell: true } satisfies ShellHandle;

export const appRouter = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <ShellLayout />,
    children: [
      { path: '/login', element: <LoginPage />, handle: ownShell },
      { path: '/invite/:token', element: <InviteRegisterPage />, handle: ownShell },
      { path: '/pool', element: <PoolPage />, handle: ownShell },
      { path: '/catalog', element: <CatalogPage />, handle: ownShell },
      { path: '/templates', element: <TemplatesPage />, handle: ownShell },
      { path: '/macrocycles', element: <MacrocyclesPage />, handle: ownShell },
      { path: '/admin/trainers', element: <AdminTrainersPage />, handle: ownShell },
      { path: '/admin/panel', element: <AdminPanelSoonPage />, handle: ownShell },
      { path: '/clients/:id', element: <ClientCardPage />, handle: ownShell },
      { path: '/clients/:clientId/diary', element: <TrainerClientDiaryPage />, handle: ownShell },
      {
        path: '/clients/:clientId/diary/:sessionId',
        element: <TrainerClientDiaryDetailPage />,
        handle: ownShell,
      },
      {
        path: '/sessions/:sessionId',
        element: <SessionPage />,
        handle: ownShell,
      },
      { path: '/sessions/:sessionId/summary', element: <SessionSummaryPage />, handle: ownShell },
      {
        path: '/cabinet',
        element: <CabinetLayout />,
        handle: ownShell,
        children: [
          { index: true, element: <Navigate to="workouts" replace /> },
          { path: 'workouts', element: <CabinetWorkoutsPage /> },
          { path: 'analytics', element: <CabinetAnalyticsSoonPage /> },
          { path: 'nutrition', element: <CabinetNutritionSoonPage /> },
          { path: 'measurements', element: <CabinetMeasurementsSoonPage /> },
          { path: 'achievements', element: <CabinetAchievementsSoonPage /> },
          { path: 'membership', element: <CabinetMembershipSoonPage /> },
          { path: 'diary', element: <CabinetDiaryPage /> },
          { path: 'diary/:sessionId', element: <CabinetDiaryDetailPage /> },
        ],
      },
    ],
  },
]);
