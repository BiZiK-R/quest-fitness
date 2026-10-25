import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InviteRegisterPage } from './InviteRegisterPage';
import * as inviteRegisterModule from '@/shared/api/invite-register';

vi.mock('@/shared/api/invite-register', () => ({
  postInviteRegister: vi.fn(),
}));

const INVITE_MESSAGE =
  'Ссылка истекла. Попросите тренера выслать новую.';

function renderInvitePage(token = 'abc-token') {
  return render(
    <MemoryRouter initialEntries={[`/invite/${token}`]}>
      <Routes>
        <Route path="/invite/:token" element={<InviteRegisterPage />} />
        <Route path="/cabinet/workouts" element={<h1>Кабинет</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InviteRegisterPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(inviteRegisterModule.postInviteRegister).mockReset();
  });

  it('shows welcome heading and registration fields', () => {
    renderInvitePage();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Добро пожаловать в Гильдию' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Телефон')).toHaveAttribute('type', 'tel');
  });

  it('replaces form with expired invite message verbatim', async () => {
    const user = userEvent.setup();
    vi.mocked(inviteRegisterModule.postInviteRegister).mockResolvedValue({
      ok: false,
      error: {
        error: { code: 'INVITE_EXPIRED', message: 'Invite expired or invalid' },
      },
    });

    renderInvitePage();

    await user.type(screen.getByLabelText('Имя'), 'Иван');
    await user.type(screen.getByLabelText('Телефон'), '9161112233');
    await user.type(screen.getByLabelText('Логин'), 'ivan_test');
    await user.type(screen.getByLabelText('Пароль'), 'password1');

    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(INVITE_MESSAGE);
    });

    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Зарегистрироваться' })).not.toBeInTheDocument();
  });

  it('shows consumed-link message with login action for INVITE_ALREADY_CONSUMED', async () => {
    const user = userEvent.setup();
    vi.mocked(inviteRegisterModule.postInviteRegister).mockResolvedValue({
      ok: false,
      error: {
        error: {
          code: 'INVITE_ALREADY_CONSUMED',
          message: 'Invite already consumed',
        },
      },
    });

    renderInvitePage();

    await user.type(screen.getByLabelText('Имя'), 'Анна');
    await user.type(screen.getByLabelText('Телефон'), '9161112234');
    await user.type(screen.getByLabelText('Логин'), 'anna_test');
    await user.type(screen.getByLabelText('Пароль'), 'password2');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'По этой ссылке уже зарегистрировались. Войдите со своим логином.',
      );
    });
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('navigates to cabinet on success', async () => {
    const user = userEvent.setup();
    vi.mocked(inviteRegisterModule.postInviteRegister).mockResolvedValue({
      ok: true,
      data: { csrfToken: 'csrf-test-token' },
    });

    renderInvitePage();

    await user.type(screen.getByLabelText('Имя'), 'Пётр');
    await user.type(screen.getByLabelText('Телефон'), '9161112235');
    await user.type(screen.getByLabelText('Логин'), 'petr_test');
    await user.type(screen.getByLabelText('Пароль'), 'password3');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Кабинет' })).toBeInTheDocument();
    });
  });
});
