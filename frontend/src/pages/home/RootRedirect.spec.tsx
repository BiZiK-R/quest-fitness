import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RootRedirect } from './RootRedirect';
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

function renderRoot() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<h1>Страница входа</h1>} />
        <Route path="/pool" element={<h1>Пул</h1>} />
        <Route path="/cabinet/workouts" element={<h1>Кабинет тренировки</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RootRedirect', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('redirects CLIENT to cabinet workouts', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: { login: 'clientuser', role: 'CLIENT' },
      error: undefined,
      response: new Response(),
    });

    renderRoot();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Кабинет тренировки' })).toBeInTheDocument();
    });
  });

  it('redirects TRAINER to pool', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: { login: 'trainer', role: 'TRAINER' },
      error: undefined,
      response: new Response(),
    });

    renderRoot();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Пул' })).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated user to login', async () => {
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'UNAUTHENTICATED', message: 'n/a' } },
      response: new Response(),
    });

    renderRoot();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Страница входа' })).toBeInTheDocument();
    });
  });
});
