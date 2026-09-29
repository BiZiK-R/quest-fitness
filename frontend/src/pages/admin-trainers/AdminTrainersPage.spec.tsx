import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTrainersPage } from './AdminTrainersPage';
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

describe('AdminTrainersPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: {
        trainers: [
          { id: 'u1', login: 'trainerone', role: 'TRAINER' },
          { id: 'u2', login: 'adminone', role: 'ADMIN' },
        ],
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
  });

  it('lists trainers from GET /api/admin/trainers', async () => {
    render(
      <MemoryRouter>
        <AdminTrainersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/trainerone/)).toBeInTheDocument();
    });
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/admin/trainers');
  });

  it('creates trainer via POST /api/admin/trainers', async () => {
    const user = userEvent.setup();
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: { id: 'u3', login: 'newbie', role: 'TRAINER' },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });

    render(
      <MemoryRouter>
        <AdminTrainersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Логин'), 'newbie');
    await user.type(screen.getByLabelText('Пароль'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Создать тренера' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/admin/trainers', {
        body: { login: 'newbie', password: 'Password1!' },
      });
    });
  });
});
