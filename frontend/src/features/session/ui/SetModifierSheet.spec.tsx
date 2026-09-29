import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SetModifierSheet } from './SetModifierSheet';

const modifiers = [
  {
    id: 'mod_1',
    name: 'Разминка',
    colorToken: 'mod-amber',
    isPreset: true,
    archivedAt: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

describe('SetModifierSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens pick list and selects palette-only swatches in create mode', () => {
    const onPick = vi.fn();
    const onCreateCustom = vi.fn();

    render(
      <SetModifierSheet
        modifiers={modifiers}
        busy={false}
        onPick={onPick}
        onCreateCustom={onCreateCustom}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByTestId('set-modifier-sheet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('set-modifier-pick-mod_1'));
    expect(onPick).toHaveBeenCalledWith('mod_1');

    fireEvent.click(screen.getByTestId('set-modifier-create-mode'));
    expect(screen.getByTestId('set-modifier-swatch-mod-teal')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /rgb/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('set-modifier-custom-name'), {
      target: { value: 'Мой' },
    });
    fireEvent.click(screen.getByTestId('set-modifier-swatch-mod-teal'));
    fireEvent.click(screen.getByTestId('set-modifier-create-submit'));
    expect(onCreateCustom).toHaveBeenCalledWith('Мой', 'mod-teal');
  });
});
