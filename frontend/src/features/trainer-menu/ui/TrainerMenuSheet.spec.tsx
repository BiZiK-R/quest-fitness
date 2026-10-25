import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TrainerMenuSheet } from './TrainerMenuSheet';

describe('TrainerMenuSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('links Админ-панель to /admin/panel for Stage 2 stub (admin only)', () => {
    render(
      <MemoryRouter>
        <TrainerMenuSheet open isAdmin onClose={() => {}} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /Админ-панель/ });
    expect(link.getAttribute('href')).toBe('/admin/panel');
    expect(screen.getByRole('link', { name: /Тренеры/ })).toBeTruthy();
  });

  it('hides admin rows for a regular trainer and shows logout when provided', async () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <TrainerMenuSheet open onClose={() => {}} onLogout={onLogout} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /Админ-панель/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Каталог упражнений' })).toBeTruthy();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
