import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    },
  };
});

const clientId = 'client_schedule_1';
const pendingWorkout = {
  id: 'wo_pending_1',
  clientProfileId: clientId,
  scheduledAt: '2026-10-15T10:00:00.000Z',
  status: 'pending' as const,
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
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();

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
    render(
      <ClientWorkoutSchedulePanel
        clientId={clientId}
        macroProgress={{ currentStageId: 'st1', stagesExhausted: false }}
        mutationsDisabled={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Пропустить' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Пропустить' }));

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

    render(
      <ClientWorkoutSchedulePanel
        clientId={clientId}
        macroProgress={{ currentStageId: 'st1', stagesExhausted: false }}
        mutationsDisabled={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Пропустить' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Пропустить' }));
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

  it('Перенести closes dialog without skip API', async () => {
    const user = userEvent.setup();
    render(
      <ClientWorkoutSchedulePanel
        clientId={clientId}
        macroProgress={{ currentStageId: 'st1', stagesExhausted: false }}
        mutationsDisabled={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Пропустить' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Пропустить' }));
    await user.click(screen.getByRole('button', { name: 'Перенести' }));

    expect(screen.queryByText(WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE)).not.toBeInTheDocument();
    expect(clientModule.apiClient.POST).not.toHaveBeenCalled();
  });

  it('hides skip/cancel actions when mutations disabled', async () => {
    render(
      <ClientWorkoutSchedulePanel
        clientId={clientId}
        macroProgress={{ currentStageId: 'st1', stagesExhausted: false }}
        mutationsDisabled={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Ожидание/)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Пропустить' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
  });
});
