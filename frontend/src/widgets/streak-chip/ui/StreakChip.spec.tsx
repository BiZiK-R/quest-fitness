import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StreakChip } from './StreakChip';

describe('StreakChip', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows apricot chip with number and plural caption when streak > 0', () => {
    render(<StreakChip streak={3} />);

    const chip = screen.getByTestId('streak-chip');
    expect(chip.className).toContain('streak-chip--active');
    expect(chip).toHaveTextContent('3');
    expect(chip).toHaveTextContent('тренировки подряд');
  });

  it('shows cream zero state without accent when streak is 0', () => {
    render(<StreakChip streak={0} />);

    const chip = screen.getByTestId('streak-chip');
    expect(chip.className).toContain('streak-chip--zero');
    expect(chip).toHaveTextContent('тренировок подряд — стрик копится');
  });
});
