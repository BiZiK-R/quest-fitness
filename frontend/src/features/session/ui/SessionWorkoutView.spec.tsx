import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionWorkoutView } from './SessionWorkoutView';

describe('SessionWorkoutView', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
  });

  it('shows first exercise name from snapshot and duration timer from endsAt', () => {
    render(
      <SessionWorkoutView
        session={{
          id: 'sess_1',
          workoutId: 'wo_1',
          clientProfileId: 'client_1',
          authorTrainerId: 'trainer_1',
          status: 'active',
          startedAt: '2026-10-01T10:00:00.000Z',
          completedAt: null,
          abandonedAt: null,
          plannedDurationMinutes: 45,
          exercises: [
            {
              id: 'se_1',
              sessionId: 'sess_1',
              exerciseId: 'ex_1',
              sortOrder: 0,
              plannedSets: 3,
              plannedReps: 10,
              plannedWeightKg: 60,
              nameSnapshot: 'Жим лёжа',
              notes: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Жим лёжа')).toBeInTheDocument();
    expect(screen.getByTestId('session-duration-timer')).toHaveTextContent('45:00');
    expect(screen.getByTestId('session-surface')).toHaveClass('surface-session');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('session-duration-timer')).toHaveTextContent('44:00');
  });
});
