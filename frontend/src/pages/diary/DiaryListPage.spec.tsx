import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryListPage } from './DiaryListPage';
import { TrainerClientDiaryPage } from './TrainerClientDiaryPage';
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

function renderList(clientId = 'client_own') {
  return render(
    <MemoryRouter initialEntries={[`/clients/${clientId}/diary`]}>
      <Routes>
        <Route path="/clients/:clientId/diary" element={<TrainerClientDiaryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DiaryListPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('shows «не завершена» for abandoned diary entries', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: {
        entries: [
          {
            sessionId: 'sess_abandoned',
            status: 'abandoned',
            startedAt: '2026-09-10T10:00:00.000Z',
            completedAt: null,
            abandonedAt: '2026-09-10T10:30:00.000Z',
            authorTrainerId: 'trainer_1',
            authorDisplayName: 'coach',
            workoutId: 'wo_1',
            setCount: 2,
            totalTonnageKg: 300,
            incomplete: true,
          },
        ],
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    renderList();

    expect(await screen.findByRole('link', { name: /не завершена/ })).toBeInTheDocument();
  });

  it('shows inline error and «Повторить» on load failure', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'LOAD_FAILED', message: 'fail' } },
      response: new Response(null, { status: 500 }),
    });

    renderList();

    expect(await screen.findByRole('alert')).toHaveTextContent(/не загрузилось/i);
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();

    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: { entries: [] },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(clientModule.apiClient.GET).toHaveBeenCalledTimes(2);
    });
  });
});
