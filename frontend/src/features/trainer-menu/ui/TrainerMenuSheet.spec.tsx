import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { TrainerMenuSheet } from './TrainerMenuSheet';

describe('TrainerMenuSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('links Админ-панель to /admin/panel for Stage 2 stub', () => {
    render(
      <MemoryRouter>
        <TrainerMenuSheet open onClose={() => {}} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Админ-панель' });
    expect(link.getAttribute('href')).toBe('/admin/panel');
  });
});
