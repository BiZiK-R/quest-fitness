import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplatesPage } from './TemplatesPage';
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

describe('TemplatesPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/templates') {
        return {
          data: {
            templates: [
              {
                id: 'tpl1',
                name: 'Силовая',
                type: 'strength',
                description: null,
                durationMinutes: 60,
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
      if (path === '/api/exercises') {
        return {
          data: {
            exercises: [
              {
                id: 'ex1',
                name: 'Жим',
                missingMuscleGroupsWarning: false,
                primaryMuscleGroupId: null,
                secondaryMuscleGroupIds: [],
                archivedAt: null,
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('loads templates list', async () => {
    render(
      <MemoryRouter>
        <TemplatesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Силовая')).toBeInTheDocument();
    });
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/templates');
  });

  it('creates template via POST /api/templates', async () => {
    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path) => {
      if (path === '/api/templates') {
        return {
          data: {
            id: 'tpl_new',
            name: 'Новый',
            type: 'strength',
            description: null,
            durationMinutes: null,
            microcycleWeeks: null,
            version: 1,
            archivedAt: null,
            exercises: [],
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TemplatesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Название', { selector: '#template-name' })).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Название', { selector: '#template-name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'Новый');
    await user.click(screen.getByRole('button', { name: 'Создать шаблон' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/templates', {
        body: expect.objectContaining({ name: 'Новый', type: 'strength' }),
      });
    });
  });

  it('shows version conflict dialog on 409', async () => {
    vi.mocked(clientModule.apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: {
        error: {
          code: 'TEMPLATE_VERSION_CONFLICT',
          message: 'conflict',
          details: { currentVersion: 3 },
        },
      },
      response: new Response(null, { status: 409 }),
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TemplatesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Силовая')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Силовая' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить шаблон' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Другой тренер изменил этот шаблон/),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Открыть заново' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить поверх' })).toBeInTheDocument();
  });
});
