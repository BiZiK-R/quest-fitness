import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ClientWorkoutsOverviewPanel,
  WORKOUTS_OVERVIEW_EMPTY_TITLE,
} from './ClientWorkoutsOverviewPanel';
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

describe('ClientWorkoutsOverviewPanel', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('renders diary link', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
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
    });

    render(
      <MemoryRouter>
        <ClientWorkoutsOverviewPanel clientId="client_1" diaryTo="/cabinet/diary" />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Дневник тренировок' });
    expect(link.getAttribute('href')).toBe('/cabinet/diary');
  });

  it('does not call Date.getMonth for month display', async () => {
    const dateSpy = vi.spyOn(Date.prototype, 'getMonth');

    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: {
        monthKey: '2026-03',
        monthLabel: 'март 2026 г.',
        workoutsThisMonth: 2,
        upcoming: [],
        nextScheduled: null,
        isEmpty: false,
        streak: 0,
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    render(
      <MemoryRouter>
        <ClientWorkoutsOverviewPanel clientId="client_1" diaryTo="/cabinet/diary" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('workouts-month-summary').textContent).toContain('март 2026 г.');
    });

    expect(dateSpy).not.toHaveBeenCalled();
    dateSpy.mockRestore();
  });

  it('shows empty copy when isEmpty', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
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
    });

    render(
      <MemoryRouter>
        <ClientWorkoutsOverviewPanel clientId="client_1" diaryTo="/cabinet/diary" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: WORKOUTS_OVERVIEW_EMPTY_TITLE })).toBeTruthy();
    expect(screen.queryByTestId('workouts-month-summary')).toBeNull();
  });
});
