import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AntdProvider } from './AntdProvider';
import { PageState } from './PageState';

function renderUi(ui: React.ReactElement) {
  return render(<AntdProvider>{ui}</AntdProvider>);
}

describe('PageState', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows human error text and calls retry on «Повторить»', async () => {
    const onRetry = vi.fn();
    renderUi(<PageState status="error" errorCode="LOAD_FAILED" onRetry={onRetry} />);

    expect(screen.getByRole('alert').textContent).toBe('Не загрузилось. Проверьте сеть.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows calm loading line without skeleton', () => {
    renderUi(<PageState status="loading" />);
    expect(screen.getByRole('status').textContent).toContain('Загружаем…');
  });
});