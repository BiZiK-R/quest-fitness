import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ClientWorkoutSchedulePanel,
  WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE,
} from './ClientWorkoutSchedulePanel';
import * as clientModule from '@/shared/api/client';

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
      POST: vi.fn(),
      PATCH: vi.fn(),
    },
  };
});

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderPanel(props: React.ComponentProps<typeof ClientWorkoutSchedulePanel>) {
  return render(
    <MemoryRouter>
      <ClientWorkoutSchedulePanel {...props} />
    </MemoryRouter>,
  );
}

const clientId = 'client_schedule_1';
const pendingWorkout = {
  id: 'wo_pending_1',
  clientProfileId: clientId,
  scheduledAt: '2026-10-15T10:00:00.000Z',
  status: 'pending' as const,
  isOverdue: false,
  templateId: 'tpl1',
  templateName: 'Силовая A',
  sourceStageId: 'st1',
  createdByUserId: 'trainer1',
  createdAt: '2026-09-29T00:00:00.000Z',
  updatedAt: '2026-09-29T00:00:00.000Z',
};

describe('ClientWorkoutSchedulePanel skip/cancel', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockReset();
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: [pendingWorkout] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('does not call skip API until confirm', async () => {
    const user = userEvent.setup();
    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ещё' }));
    await user.click(await screen.findByRole('button', { name: 'Пропустить' }));

    expect(screen.getByText(WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE)).toBeInTheDocument();
    expect(clientModule.apiClient.POST).not.toHaveBeenCalledWith(
      '/api/workouts/{id}/skip',
      expect.anything(),
    );
  });

  it('calls skip API after confirm', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path) => {
      if (path === '/api/workouts/{id}/skip') {
        return {
          data: { ...pendingWorkout, status: 'skipped' },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ещё' }));
    await user.click(await screen.findByRole('button', { name: 'Пропустить' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Пропустить' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith(
        '/api/workouts/{id}/skip',
        expect.objectContaining({
          params: expect.objectContaining({
            path: { id: pendingWorkout.id },
          }),
        }),
      );
    });
  });

  it('Перенести from confirm opens reschedule sheet without skip API', async () => {
    const user = userEvent.setup();
    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ещё' }));
    await user.click(await screen.findByRole('button', { name: 'Пропустить' }));
    const confirmDialog = screen.getByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: 'Перенести' }));

    expect(screen.queryByText(WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE)).not.toBeInTheDocument();
    expect(clientModule.apiClient.POST).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Перенести тренировку' })).toBeInTheDocument();
  });

  it('reschedule submit updates displayed scheduled time', async () => {
    const user = userEvent.setup();
    const newIso = '2026-12-20T15:00:00.000Z';
    const formattedNew = new Date(newIso).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    let listWorkouts = [pendingWorkout];

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: listWorkouts },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    vi.mocked(clientModule.apiClient.PATCH).mockImplementation(async (path) => {
      if (path === '/api/workouts/{id}') {
        listWorkouts = [{ ...pendingWorkout, scheduledAt: newIso }];
        return {
          data: listWorkouts[0],
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ещё' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ещё' }));
    await user.click(await screen.findByRole('button', { name: 'Перенести' }));

    const sheet = screen.getByRole('dialog', { name: /Перенести тренировку/i });
    await user.click(within(sheet).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(clientModule.apiClient.PATCH).toHaveBeenCalledWith(
        '/api/workouts/{id}',
        expect.objectContaining({
          params: { path: { id: pendingWorkout.id } },
          body: expect.objectContaining({ scheduledAt: expect.any(String) }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(new RegExp(formattedNew.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    });
  });

  it('shows status pill, overdue label from API, and Start stub for holder', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: {
            workouts: [
              pendingWorkout,
              {
                ...pendingWorkout,
                id: 'wo_attended',
                status: 'attended' as const,
                isOverdue: false,
              },
              {
                ...pendingWorkout,
                id: 'wo_overdue',
                isOverdue: true,
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getAllByText('Ожидание').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Пришёл')).toBeInTheDocument();
    expect(screen.getByText('Просрочена')).toBeInTheDocument();

    const startButton = screen.getAllByRole('button', { name: /Начать/i })[0];
    expect(startButton).toBeEnabled();
  });

  it('Начать calls start session API and navigates to session page', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path) => {
      if (path === '/api/workouts/{id}/session') {
        return {
          data: {
            id: 'sess_new_1',
            workoutId: pendingWorkout.id,
            clientProfileId: clientId,
            authorTrainerId: 'trainer1',
            status: 'active',
            startedAt: '2026-10-01T10:00:00.000Z',
            completedAt: null,
            abandonedAt: null,
            plannedDurationMinutes: 45,
            exercises: [],
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Начать' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/workouts/{id}/session', {
        params: { path: { id: pendingWorkout.id } },
      });
      expect(navigateMock).toHaveBeenCalledWith('/sessions/sess_new_1');
    });
  });

  it('hides skip/cancel actions when mutations disabled', async () => {
    renderPanel({
      clientId,
      macroProgress: { currentStageId: 'st1', stagesExhausted: false },
      mutationsDisabled: true,
    });

    await waitFor(() => {
      expect(screen.getByText(/Ожидание/)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Пропустить' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
  });
});
