import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AntdProvider } from './AntdProvider';
import { AppShell } from './AppShell';
import { BottomCta } from './BottomCta';
import { Button } from './Button';

describe('AppShell', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders appbar with title as the page h1, action and bottom slot', () => {
    render(
      <AntdProvider>
        <AppShell
          title="Пул клиентов"
          action={<button type="button">Меню</button>}
          bottom={<BottomCta primary={<Button variant="primary">Добавить клиента</Button>} />}
        >
          <p>content</p>
        </AppShell>
      </AntdProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Пул клиентов' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Меню' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Добавить клиента' })).toBeTruthy();
    expect(screen.getByRole('main').textContent).toBe('content');
  });

  it('shows brand instead of h1 when no title', () => {
    render(
      <AntdProvider>
        <AppShell>
          <p>content</p>
        </AppShell>
      </AntdProvider>,
    );

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByText('Quest Fitness')).toBeTruthy();
  });
});
