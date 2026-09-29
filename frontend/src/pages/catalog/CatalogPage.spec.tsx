import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogPage } from './CatalogPage';
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

const WARNING = 'Без групп упражнение не попадёт в статистику мышц';

describe('CatalogPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/muscle-groups') {
        return {
          data: {
            muscleGroups: [
              { id: 'mg1', name: 'Грудь', sortOrder: 1 },
              { id: 'mg2', name: 'Спина', sortOrder: 2 },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/exercises') {
        return {
          data: { exercises: [{ id: 'ex1', name: 'Жим', missingMuscleGroupsWarning: false, primaryMuscleGroupId: 'mg1', secondaryMuscleGroupIds: [], archivedAt: null }] },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('loads exercises and muscle groups', async () => {
    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Жим')).toBeInTheDocument();
    });
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/exercises');
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/muscle-groups');
  });

  it('shows warning when no muscle groups selected', async () => {
    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Название')).toBeInTheDocument();
    });

    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it('creates exercise via POST /api/exercises', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: {
        id: 'ex2',
        name: 'Планка',
        missingMuscleGroupsWarning: true,
        primaryMuscleGroupId: null,
        secondaryMuscleGroupIds: [],
        archivedAt: null,
      },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Название')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Название'), 'Планка');
    await user.click(screen.getByRole('button', { name: 'Сохранить упражнение' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/exercises', {
        body: { name: 'Планка' },
      });
    });
  });

  it('archives exercise via POST archive', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: {
        id: 'ex1',
        name: 'Жим',
        missingMuscleGroupsWarning: false,
        primaryMuscleGroupId: 'mg1',
        secondaryMuscleGroupIds: [],
        archivedAt: new Date().toISOString(),
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'В архив' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'В архив' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/exercises/{id}/archive', {
        params: { path: { id: 'ex1' } },
      });
    });
  });
});
