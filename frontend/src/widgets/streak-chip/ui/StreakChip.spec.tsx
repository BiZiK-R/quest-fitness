import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StreakChip } from './StreakChip';

describe('StreakChip', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses accessible name with streak count when streak > 0', () => {
    render(<StreakChip streak={3} />);

    expect(screen.getByLabelText('Стрик тренировок: 3 подряд')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows cream «копится» state when streak is 0', () => {
    render(<StreakChip streak={0} />);

    const chip = screen.getByTestId('streak-chip');
    expect(chip.className).toContain('streak-chip--accumulating');
    expect(screen.getByText('копится')).toBeTruthy();
    expect(screen.queryByLabelText(/Стрик тренировок/)).toBeNull();
  });
});
