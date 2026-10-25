import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusPill, type WorkoutStatus } from './StatusPill';

describe('StatusPill', () => {
  afterEach(() => {
    cleanup();
  });

  it.each<[WorkoutStatus, string]>([
    ['waiting', 'Ожидание'],
    ['arrived', 'Пришёл'],
    ['missed', 'Пропущена'],
    ['cancelled', 'Отменена'],
  ])('renders canonical word for %s', (status, word) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(word).className).toContain(`ui-status-pill--${status}`);
  });
});
