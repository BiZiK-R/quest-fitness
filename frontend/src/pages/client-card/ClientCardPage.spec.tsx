import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientCardPage } from './ClientCardPage';
import * as clientModule from '@/shared/api/client';

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
      POST: vi.fn(),
      PUT: vi.fn(),
      PATCH: vi.fn(),
      DELETE: vi.fn(),
    },
  };
});

const clientId = 'client_card_1';
const trainerId = 'user_trainer_1';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/clients/${clientId}`]}>
      <Routes>
        <Route path="/clients/:id" element={<ClientCardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClientCardPage macro progress', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.PUT).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.DELETE).mockReset();

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/auth/me') {
        return {
          data: { id: trainerId, role: 'TRAINER', login: 'trainer' },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}') {
        return {
          data: {
            id: clientId,
            displayName: 'Тестовый клиент',
            userId: null,
            deactivatedAt: null,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
            lockStatus: {
              holderTrainerId: trainerId,
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
            macroProgress: null,
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/macrocycles') {
        return {
          data: {
            macrocycles: [
              {
                id: 'macro1',
                name: 'Силовой сезон',
                periodicityNote: null,
                stages: [
                  {
                    id: 'st1',
                    templateId: 'tpl1',
                    templateName: 'Силовая A',
                    sortOrder: 0,
                  },
                  {
                    id: 'st2',
                    templateId: 'tpl2',
                    templateName: 'Силовая B',
                    sortOrder: 1,
                  },
                ],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: [] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('assigns macrocycle via PUT when holder', async () => {
    vi.mocked(clientModule.apiClient.PUT).mockImplementation(async (path) => {
      if (path === '/api/clients/{id}/macro-progress') {
        return {
          data: {
            macrocycleId: 'macro1',
            currentStageId: 'st1',
            stagesExhausted: false,
            macrocycleName: 'Силовой сезон',
            currentStageSortOrder: 0,
            stageCount: 2,
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Тестовый клиент' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Назначить макроцикл' }));

    await waitFor(() => {
      expect(clientModule.apiClient.PUT).toHaveBeenCalledWith('/api/clients/{id}/macro-progress', {
        params: { path: { id: clientId } },
        body: { macrocycleId: 'macro1' },
      });
    });
  });

  it('shows stages exhausted warning after override to last stage', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path, opts) => {
      if (path === '/api/auth/me') {
        return {
          data: { id: trainerId, role: 'TRAINER', login: 'trainer' },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}') {
        return {
          data: {
            id: clientId,
            displayName: 'Тестовый клиент',
            userId: null,
            deactivatedAt: null,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
            lockStatus: {
              holderTrainerId: trainerId,
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
            macroProgress: {
              macrocycleId: 'macro1',
              currentStageId: 'st1',
              stagesExhausted: false,
              macrocycleName: 'Силовой сезон',
              currentStageSortOrder: 0,
              stageCount: 2,
            },
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/macrocycles') {
        return {
          data: {
            macrocycles: [
              {
                id: 'macro1',
                name: 'Силовой сезон',
                periodicityNote: null,
                stages: [
                  {
                    id: 'st1',
                    templateId: 'tpl1',
                    templateName: 'Силовая A',
                    sortOrder: 0,
                  },
                  {
                    id: 'st2',
                    templateId: 'tpl2',
                    templateName: 'Силовая B',
                    sortOrder: 1,
                  },
                ],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: [] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/templates') {
        return {
          data: {
            templates: [
              {
                id: 'tpl_manual',
                name: 'Ручной шаблон',
                type: 'strength',
                description: null,
                durationMinutes: null,
                microcycleWeeks: null,
                version: 1,
                archivedAt: null,
                exercises: [],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    vi.mocked(clientModule.apiClient.PATCH).mockImplementation(async (path) => {
      if (path === '/api/clients/{id}/macro-progress') {
        return {
          data: {
            macrocycleId: 'macro1',
            currentStageId: 'st2',
            stagesExhausted: true,
            macrocycleName: 'Силовой сезон',
            currentStageSortOrder: 1,
            stageCount: 2,
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Силовая B/ })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Этап'), 'st2');

    await waitFor(() => {
      expect(
        screen.getAllByText(/Этапы кончились — продлите цикл или выберите шаблон тренировки вручную\./)
          .length,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('ClientCardPage workout schedule', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.PUT).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();
    vi.mocked(clientModule.apiClient.DELETE).mockReset();

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/auth/me') {
        return {
          data: { id: trainerId, role: 'TRAINER', login: 'trainer' },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}') {
        return {
          data: {
            id: clientId,
            displayName: 'Тестовый клиент',
            userId: null,
            deactivatedAt: null,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
            lockStatus: {
              holderTrainerId: trainerId,
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
            macroProgress: {
              macrocycleId: 'macro1',
              currentStageId: 'st1',
              stagesExhausted: false,
              macrocycleName: 'Силовой сезон',
              currentStageSortOrder: 0,
              stageCount: 2,
            },
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: [] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/macrocycles') {
        return {
          data: { macrocycles: [] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('assigns workout with Idempotency-Key when holder', async () => {
    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path, opts) => {
      if (path === '/api/clients/{id}/workouts') {
        expect(opts?.params?.header?.['Idempotency-Key']).toBeTruthy();
        return {
          data: {
            id: 'wo_1',
            clientProfileId: clientId,
            scheduledAt: '2026-10-10T07:00:00.000Z',
            status: 'pending',
            templateId: 'tpl1',
            templateName: 'Силовая A',
            sourceStageId: 'st1',
            createdByUserId: trainerId,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Дата и время')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Дата и время'), '2026-10-10T10:00');
    await user.click(screen.getByRole('button', { name: 'Назначить тренировку' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith(
        '/api/clients/{id}/workouts',
        expect.objectContaining({
          params: expect.objectContaining({
            path: { id: clientId },
            header: expect.objectContaining({
              'Idempotency-Key': expect.any(String),
            }),
          }),
          body: expect.objectContaining({
            scheduledAt: expect.any(String),
          }),
        }),
      );
    });
  });

  it('requires manual template when stages exhausted', async () => {
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/auth/me') {
        return {
          data: { id: trainerId, role: 'TRAINER', login: 'trainer' },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}') {
        return {
          data: {
            id: clientId,
            displayName: 'Тестовый клиент',
            userId: null,
            deactivatedAt: null,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
            lockStatus: {
              holderTrainerId: trainerId,
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
            macroProgress: {
              macrocycleId: 'macro1',
              currentStageId: 'st2',
              stagesExhausted: true,
              macrocycleName: 'Силовой сезон',
              currentStageSortOrder: 1,
              stageCount: 2,
            },
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/clients/{id}/workouts') {
        return {
          data: { workouts: [] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/templates') {
        return {
          data: {
            templates: [
              {
                id: 'tpl_manual',
                name: 'Ручной шаблон',
                type: 'strength',
                description: null,
                durationMinutes: null,
                microcycleWeeks: null,
                version: 1,
                archivedAt: null,
                exercises: [],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/macrocycles') {
        return { data: { macrocycles: [] }, error: undefined, response: new Response(null, { status: 200 }) };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path, opts) => {
      if (path === '/api/clients/{id}/workouts') {
        expect(opts?.body).toMatchObject({
          templateId: 'tpl_manual',
        });
        return {
          data: {
            id: 'wo_2',
            clientProfileId: clientId,
            scheduledAt: '2026-10-11T07:00:00.000Z',
            status: 'pending',
            templateId: 'tpl_manual',
            templateName: 'Ручной шаблон',
            sourceStageId: null,
            createdByUserId: trainerId,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Шаблон')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Дата и время'), '2026-10-11T10:00');
    await user.click(screen.getByRole('button', { name: 'Назначить тренировку' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalled();
    });
  });
});
