import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import * as clientModule from '@/shared/api/client';
import * as loginModule from '@/shared/api/login';

vi.mock('@/shared/api/login', () => ({
  postTrainerLogin: vi.fn(),
}));

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    setCsrfToken: vi.fn(actual.setCsrfToken),
  };
});

function renderLoginAtPoolRoute() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pool" element={<h1>Пул клиентов</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(loginModule.postTrainerLogin).mockReset();
  });

  it('keeps login and password after failed submit', async () => {
    vi.mocked(loginModule.postTrainerLogin).mockResolvedValue({
      ok: false,
      error: {
        error: { code: 'UNAUTHENTICATED', message: 'Invalid login or password' },
      },
    });

    const user = userEvent.setup();
    renderLoginAtPoolRoute();

    await user.type(screen.getByLabelText(/логин/i), 'adminuser');
    await user.type(screen.getByLabelText(/пароль/i), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('UNAUTHENTICATED')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/логин/i)).toHaveValue('adminuser');
    expect(screen.getByLabelText(/пароль/i)).toHaveValue('wrong-pass');
  });

  it('navigates to pool after successful login', async () => {
    vi.mocked(loginModule.postTrainerLogin).mockResolvedValue({
      ok: true,
      data: { csrfToken: 'csrf-test-token' },
    });

    const user = userEvent.setup();
    renderLoginAtPoolRoute();

    await user.type(screen.getByLabelText(/логин/i), 'adminuser');
    await user.type(screen.getByLabelText(/пароль/i), 'SecretPass1!');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Пул клиентов' })).toBeInTheDocument();
    });

    expect(clientModule.setCsrfToken).toHaveBeenCalledWith('csrf-test-token');
  });
});
