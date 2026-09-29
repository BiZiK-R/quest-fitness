import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoolPage } from './PoolPage';
import * as clientModule from '@/shared/api/client';
import * as clipboardModule from '@/shared/lib/copy-to-clipboard';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    setCsrfToken: vi.fn(actual.setCsrfToken),
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
      POST: vi.fn(),
    },
  };
});

vi.mock('@/shared/lib/copy-to-clipboard', async (importOriginal) => {
  const actual = await importOriginal<typeof clipboardModule>();
  return {
    ...actual,
    copyToClipboard: vi.fn(actual.copyToClipboard),
  };
});

describe('PoolPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clipboardModule.copyToClipboard).mockReset();
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: {
        clients: [
          {
            id: 'cl_list_1',
            displayName: 'Клиент из списка',
            userId: null,
            deactivatedAt: null,
            createdAt: '2026-09-29T00:00:00.000Z',
            updatedAt: '2026-09-29T00:00:00.000Z',
          },
        ],
      },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
  });

  it('renders client display names from GET /api/clients', async () => {
    render(
      <MemoryRouter>
        <PoolPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Клиент из списка')).toBeInTheDocument();
    });

    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/clients');
  });

  it('shows copy confirmation after invite link copy', async () => {
    vi.mocked(clipboardModule.copyToClipboard).mockResolvedValue(undefined);

    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path) => {
      if (path === '/api/clients/{clientId}/invites') {
        return {
          data: {
            inviteUrl: '/invite/test-token-abc',
            token: 'test-token-abc',
            expiresAt: '2026-09-30T12:00:00.000Z',
            expiresAtLabel: 'до 30 сентября 2026 г., 15:00',
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return {
        data: undefined,
        error: undefined,
        response: new Response(null, { status: 201 }),
      };
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PoolPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Клиент из списка')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /пригласить/i }));

    await waitFor(() => {
      expect(screen.getByText(/ссылка живёт 1 сутки/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /копировать/i }));

    await waitFor(() => {
      expect(screen.getByText('Скопировано')).toBeInTheDocument();
    });

    expect(clipboardModule.copyToClipboard).toHaveBeenCalledWith(
      `${window.location.origin}/invite/test-token-abc`,
    );
  });

  it('POST /api/clients when create form is submitted', async () => {
    vi.mocked(clientModule.apiClient.POST).mockResolvedValue({
      data: {
        id: 'cl_new',
        displayName: 'Новый клиент',
        userId: null,
        deactivatedAt: null,
        createdAt: '2026-09-29T00:00:00.000Z',
        updatedAt: '2026-09-29T00:00:00.000Z',
      },
      error: undefined,
      response: new Response(null, { status: 201 }),
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PoolPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Клиент из списка')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/имя клиента/i), 'Новый клиент');
    await user.click(screen.getByRole('button', { name: /добавить в пул/i }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/clients', {
        body: { displayName: 'Новый клиент' },
      });
    });
  });
});
