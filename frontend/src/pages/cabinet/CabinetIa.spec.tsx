import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as clientModule from '@/shared/api/client';

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
    },
  };
});
import { ShellLayout } from '@/app/layout/ShellLayout';
import { CabinetLayout } from '@/app/layout/CabinetLayout';
import {
  CABINET_SOON_STUBS,
  TRAINER_ADMIN_PANEL_SOON_STUB,
} from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { CABINET_TAB_LABELS } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';
import { CabinetWorkoutsPage } from './CabinetWorkoutsPage';
import { CabinetAnalyticsSoonPage } from './CabinetAnalyticsSoonPage';
import { CabinetNutritionSoonPage } from './CabinetNutritionSoonPage';
import { CabinetMeasurementsSoonPage } from './CabinetMeasurementsSoonPage';
import { CabinetAchievementsSoonPage } from './CabinetAchievementsSoonPage';
import { CabinetMembershipSoonPage } from './CabinetMembershipSoonPage';
import { AdminPanelSoonPage } from '@/pages/admin-panel/AdminPanelSoonPage';

function renderCabinetAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <ShellLayout />,
        children: [
          {
            path: '/cabinet',
            element: <CabinetLayout />,
            handle: { ownShell: true },
            children: [
              { path: 'workouts', element: <CabinetWorkoutsPage /> },
              { path: 'analytics', element: <CabinetAnalyticsSoonPage /> },
              { path: 'nutrition', element: <CabinetNutritionSoonPage /> },
              { path: 'measurements', element: <CabinetMeasurementsSoonPage /> },
              { path: 'achievements', element: <CabinetAchievementsSoonPage /> },
              { path: 'membership', element: <CabinetMembershipSoonPage /> },
            ],
          },
          { path: '/admin/panel', element: <AdminPanelSoonPage /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe('Cabinet IA (Story 6.3)', () => {
  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: {
        id: 'user_client',
        role: 'CLIENT',
        login: 'client',
        clientProfileId: 'client_me',
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('renders tab bar with six icon+label tabs', () => {
    renderCabinetAt('/cabinet/workouts');

    expect(screen.getByRole('navigation', { name: 'Кабинет' })).toBeTruthy();
    expect(screen.getByRole('tablist')).toBeTruthy();

    for (const label of CABINET_TAB_LABELS) {
      expect(screen.getByRole('tab', { name: new RegExp(label) })).toBeTruthy();
    }
    expect(screen.getAllByRole('tab')).toHaveLength(6);
  });

  it('marks Workouts tab active with indicator class on /cabinet/workouts', () => {
    renderCabinetAt('/cabinet/workouts');

    const workoutsTab = screen.getByRole('tab', { name: /Тренировки/ });
    expect(workoutsTab.className).toContain('cabinet-tab-bar__tab--active');
  });

  it.each([
    ['/cabinet/analytics', CABINET_SOON_STUBS.analytics],
    ['/cabinet/nutrition', CABINET_SOON_STUBS.nutrition],
    ['/cabinet/measurements', CABINET_SOON_STUBS.measurements],
    ['/cabinet/achievements', CABINET_SOON_STUBS.achievements],
    ['/cabinet/membership', CABINET_SOON_STUBS.membership],
  ] as const)('shows verbatim soon-stub on %s', (path, copy) => {
    renderCabinetAt(path);

    expect(screen.getByRole('heading', { level: 2, name: copy.title })).toBeTruthy();
    expect(screen.getByText(copy.line)).toBeTruthy();
  });
});

describe('Trainer admin panel soon-stub', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows verbatim Кузница copy on /admin/panel', () => {
    const router = createMemoryRouter(
      [
        {
          element: <ShellLayout />,
          children: [{ path: '/admin/panel', element: <AdminPanelSoonPage /> }],
        },
      ],
      { initialEntries: ['/admin/panel'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: TRAINER_ADMIN_PANEL_SOON_STUB.title,
      }),
    ).toBeTruthy();
    expect(screen.getByText(TRAINER_ADMIN_PANEL_SOON_STUB.line)).toBeTruthy();
  });
});
