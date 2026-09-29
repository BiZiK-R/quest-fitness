import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionPage } from './SessionPage';
import * as clientModule from '@/shared/api/client';
import userEvent from '@testing-library/user-event';

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
      POST: vi.fn(),
    },
  };
});

describe('SessionPage snapshot display', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
  });

  it('renders exercise nameSnapshot from GET even when catalog name differs', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/sessions/{id}') {
        return {
          data: {
            id: 'sess_1',
            workoutId: 'wo_1',
            clientProfileId: 'client_1',
            authorTrainerId: 'trainer_1',
            status: 'active',
            startedAt: '2026-10-01T10:00:00.000Z',
            completedAt: null,
            abandonedAt: null,
            plannedDurationMinutes: 60,
            exercises: [
              {
                id: 'se_1',
                sessionId: 'sess_1',
                exerciseId: 'ex_1',
                sortOrder: 0,
                plannedSets: null,
                plannedReps: null,
                plannedWeightKg: null,
                nameSnapshot: 'Старое имя из snapshot',
                notes: null,
              },
            ],
            sets: [],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    render(
      <MemoryRouter initialEntries={['/sessions/sess_1']}>
        <Routes>
          <Route path="/sessions/:sessionId" element={<SessionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Старое имя из snapshot')).toBeInTheDocument();
    });
  });

  it('calls complete API when Завершить is clicked', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/sessions/{id}') {
        return {
          data: {
            id: 'sess_1',
            workoutId: 'wo_1',
            clientProfileId: 'client_1',
            authorTrainerId: 'trainer_1',
            status: 'active',
            startedAt: '2026-10-01T10:00:00.000Z',
            completedAt: null,
            abandonedAt: null,
            plannedDurationMinutes: 60,
            exercises: [
              {
                id: 'se_1',
                sessionId: 'sess_1',
                exerciseId: 'ex_1',
                sortOrder: 0,
                plannedSets: null,
                plannedReps: null,
                plannedWeightKg: null,
                nameSnapshot: 'Жим',
                notes: null,
                supersetGroupId: null,
              },
            ],
            sets: [],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: {
        sessionId: 'sess_1',
        setCount: 0,
        totalTonnageKg: 0,
        perExercise: [],
      },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });

    render(
      <MemoryRouter initialEntries={['/sessions/sess_1']}>
        <Routes>
          <Route path="/sessions/:sessionId" element={<SessionPage />} />
          <Route path="/sessions/:sessionId/summary" element={<p>summary</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('session-complete-button')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('session-complete-button'));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/sessions/{id}/complete', {
        params: { path: { id: 'sess_1' } },
      });
    });
  });
});
