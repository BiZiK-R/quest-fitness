import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AntdProvider } from './AntdProvider';
import { BottomSheet } from './BottomSheet';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <AntdProvider>
      <button type="button" onClick={() => setOpen(true)}>
        Открыть
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Перенос">
        <button type="button">Сохранить</button>
      </BottomSheet>
    </AntdProvider>
  );
}

describe('BottomSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens as modal dialog with focus on title and closes by Esc returning focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();

    const trigger = screen.getByRole('button', { name: 'Открыть' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Перенос' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Перенос' }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes by close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Открыть' }));

    await user.click(await screen.findByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
