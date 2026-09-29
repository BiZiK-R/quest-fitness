import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionSummaryView } from './SessionSummaryView';

describe('SessionSummaryView', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows firstTime label without growth percent', () => {
    render(
      <SessionSummaryView
        summary={{
          sessionId: 'sess_1',
          setCount: 2,
          totalTonnageKg: 500,
          perExercise: [
            {
              exerciseId: 'ex_1',
              nameSnapshot: 'Жим',
              setCount: 2,
              tonnageKg: 500,
              growthPercent: null,
              firstTime: true,
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('session-growth-ex_1')).toHaveTextContent('Первый раз');
  });

  it('shows growth percent when provided', () => {
    render(
      <SessionSummaryView
        summary={{
          sessionId: 'sess_2',
          setCount: 1,
          totalTonnageKg: 550,
          perExercise: [
            {
              exerciseId: 'ex_1',
              nameSnapshot: 'Жим',
              setCount: 1,
              tonnageKg: 550,
              growthPercent: 10,
              firstTime: false,
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('session-growth-ex_1')).toHaveTextContent('+10%');
  });
});
