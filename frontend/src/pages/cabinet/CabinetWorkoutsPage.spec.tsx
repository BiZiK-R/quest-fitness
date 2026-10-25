import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CabinetWorkoutsPage, NEXT_WORKOUT_EMPTY_COPY } from './CabinetWorkoutsPage';
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

describe('CabinetWorkoutsPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('shows empty copy from overview BFF', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/auth/me') {
        return {
          data: {
            id: 'user_client',
            role: 'CLIENT',
            login: 'client',
            clientProfileId: 'client_me',
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts/overview') {
        return {
          data: {
            monthKey: '2026-03',
            monthLabel: 'март 2026 г.',
            workoutsThisMonth: 0,
            upcoming: [],
            nextScheduled: null,
            isEmpty: true,
            streak: 0,
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    render(
      <MemoryRouter>
        <CabinetWorkoutsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(NEXT_WORKOUT_EMPTY_COPY.title)).toBeTruthy();
    expect(screen.getByText(NEXT_WORKOUT_EMPTY_COPY.line)).toBeTruthy();
  });

  it('displays month count from BFF fields without deriving month in page', async () => {
    const dateSpy = vi.spyOn(Date.prototype, 'getMonth');

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/auth/me') {
        return {
          data: {
            id: 'user_client',
            role: 'CLIENT',
            login: 'client',
            clientProfileId: 'client_me',
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts/overview') {
        return {
          data: {
            monthKey: '2026-09',
            monthLabel: 'сентябрь 2026 г.',
            workoutsThisMonth: 4,
            upcoming: [],
            nextScheduled: null,
            isEmpty: false,
            streak: 0,
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    render(
      <MemoryRouter>
        <CabinetWorkoutsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('workouts-month-summary').textContent).toContain('сентябрь 2026 г.');
      expect(screen.getByTestId('workouts-month-summary').textContent).toContain('4 тренировки');
    });

    expect(dateSpy).not.toHaveBeenCalled();
    dateSpy.mockRestore();
  });
});
