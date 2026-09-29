import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import * as clientModule from '@/shared/api/client';
import * as loginModule from '@/shared/api/login';

vi.mock('@/shared/api/login', () => ({
  postLogin: vi.fn(),
  postTrainerLogin: vi.fn(),
}));

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    setCsrfToken: vi.fn(actual.setCsrfToken),
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
    },
  };
});

function renderLoginRoutes() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pool" element={<h1>Пул клиентов</h1>} />
        <Route path="/cabinet/workouts" element={<h1>Кабинет</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(loginModule.postLogin).mockReset();
    vi.mocked(clientModule.apiClient.GET).mockReset();
  });

  it('shows login-or-phone label and trainer password hint', () => {
    renderLoginRoutes();
    expect(screen.getByLabelText(/логин или телефон/i)).toBeInTheDocument();
    expect(screen.getByText(/обратитесь к тренеру/i)).toBeInTheDocument();
  });

  it('keeps login and password after failed submit', async () => {
    vi.mocked(loginModule.postLogin).mockResolvedValue({
      ok: false,
      error: {
        error: { code: 'UNAUTHENTICATED', message: 'Invalid login or password' },
      },
    });

    const user = userEvent.setup();
    renderLoginRoutes();

    await user.type(screen.getByLabelText(/логин или телефон/i), 'adminuser');
    await user.type(screen.getByLabelText(/пароль/i), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('UNAUTHENTICATED')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/логин или телефон/i)).toHaveValue('adminuser');
    expect(screen.getByLabelText(/пароль/i)).toHaveValue('wrong-pass');
  });

  it('navigates to pool after successful trainer login', async () => {
    vi.mocked(loginModule.postLogin).mockResolvedValue({
      ok: true,
      data: { csrfToken: 'csrf-test-token' },
    });
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: { login: 'adminuser', role: 'ADMIN' },
      error: undefined,
      response: new Response(),
    });

    const user = userEvent.setup();
    renderLoginRoutes();

    await user.type(screen.getByLabelText(/логин или телефон/i), 'adminuser');
    await user.type(screen.getByLabelText(/пароль/i), 'SecretPass1!');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Пул клиентов' })).toBeInTheDocument();
    });

    expect(clientModule.setCsrfToken).toHaveBeenCalledWith('csrf-test-token');
  });

  it('navigates to cabinet after successful client login', async () => {
    vi.mocked(loginModule.postLogin).mockResolvedValue({
      ok: true,
      data: { csrfToken: 'csrf-client' },
    });
    vi.mocked(clientModule.apiClient.GET).mockResolvedValue({
      data: { login: 'clientuser', role: 'CLIENT' },
      error: undefined,
      response: new Response(),
    });

    const user = userEvent.setup();
    renderLoginRoutes();

    await user.type(screen.getByLabelText(/логин или телефон/i), '89161234567');
    await user.type(screen.getByLabelText(/пароль/i), 'ClientPass1!');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Кабинет' })).toBeInTheDocument();
    });
  });
});
