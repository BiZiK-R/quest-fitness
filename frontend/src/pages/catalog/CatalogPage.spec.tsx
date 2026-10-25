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
      PATCH: vi.fn(),
    },
  };
});

const WARNING = 'Без групп упражнение не попадёт в статистику мышц';

const ok = (data: unknown) => ({
  data,
  error: undefined,
  response: new Response(null, { status: 200 }),
});

function mockCatalog(exercises: unknown[]) {
  vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
    if (path === '/api/muscle-groups') {
      return ok({
        muscleGroups: [
          { id: 'mg1', name: 'Грудь', sortOrder: 1 },
          { id: 'mg2', name: 'Спина', sortOrder: 2 },
        ],
      });
    }
    if (path === '/api/exercises') {
      return ok({ exercises });
    }
    return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
  });
}

const BENCH = {
  id: 'ex1',
  name: 'Жим',
  missingMuscleGroupsWarning: false,
  primaryMuscleGroupId: 'mg1',
  secondaryMuscleGroupIds: [],
  archivedAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}

describe('CatalogPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();
    mockCatalog([BENCH]);
  });

  it('shows appbar title and loads exercises with archived ones', async () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Каталог упражнений' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Жим/ })).toBeInTheDocument();
    });
    expect(screen.getByText('Грудь')).toBeInTheDocument();
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/exercises', {
      params: { query: { includeArchived: true } },
    });
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/muscle-groups');
  });

  it('shows empty state when catalog is empty', async () => {
    mockCatalog([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Каталог пуст' })).toBeInTheDocument();
    });
  });

  it('shows hidden exercises in a separate section', async () => {
    mockCatalog([BENCH, { ...BENCH, id: 'ex2', name: 'Тяга', archivedAt: '2026-09-01T00:00:00Z' }]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Скрытые' })).toBeInTheDocument();
    });
    expect(screen.getByText(/Скрыто/)).toBeInTheDocument();
  });

  it('filters by search and shows miss text', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/найти упражнение/i)).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/найти упражнение/i), 'присед');

    expect(screen.getByText('Ничего не нашли')).toBeInTheDocument();
  });

  it('opens create sheet with no-groups warning and creates exercise', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: { ...BENCH, id: 'ex3', name: 'Планка', primaryMuscleGroupId: null },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Добавить упражнение' }));

    const dialog = await screen.findByRole('dialog', { name: 'Новое упражнение' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(WARNING)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Название'), 'Планка');
    await user.click(screen.getByRole('radio', { name: 'Спина' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/exercises', {
        body: { name: 'Планка', primaryMuscleGroupId: 'mg2' },
      });
    });
  });

  it('archives exercise after confirm', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: { ...BENCH, archivedAt: new Date().toISOString() },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Жим/ }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    const confirm = await screen.findByRole('alertdialog', { name: 'Удалить упражнение?' });
    expect(confirm).toHaveTextContent('Упражнение скроется из каталога, история сохранится.');
    const confirmButtons = screen.getAllByRole('button', { name: 'Удалить' });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/exercises/{id}/archive', {
        params: { path: { id: 'ex1' } },
      });
    });
  });
});
