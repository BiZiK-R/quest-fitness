import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as sessionSetApi from '../api/session-set-api';
import { SessionWorkoutView } from './SessionWorkoutView';

vi.mock('../api/session-set-api', () => ({
  upsertSessionSet: vi.fn(),
  deleteSessionSet: vi.fn(),
}));

const baseSession = {
  id: 'sess_1',
  workoutId: 'wo_1',
  clientProfileId: 'client_1',
  authorTrainerId: 'trainer_1',
  status: 'active' as const,
  startedAt: '2026-10-01T10:00:00.000Z',
  completedAt: null,
  abandonedAt: null,
  plannedDurationMinutes: 45,
  sets: [] as Array<{
    id: string;
    sessionId: string;
    sessionExerciseId: string;
    sequenceIndex: number;
    weightKg: number | null;
    reps: number | null;
    rpe: number | null;
    createdAt: string;
    updatedAt: string;
  }>,
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
      supersetGroupId: null,
    },
  ],
};

const savedSetPayload = {
  id: '550e8400-e29b-41d4-a716-446655440099',
  sessionId: 'sess_1',
  sessionExerciseId: 'se_1',
  sequenceIndex: 1,
  weightKg: 60,
  reps: 10,
  rpe: 0,
  createdAt: '2026-10-01T10:01:00.000Z',
  updatedAt: '2026-10-01T10:01:00.000Z',
};

async function confirmSetAndWait(options?: { fakeTimers?: boolean }) {
  fireEvent.click(screen.getByTestId('session-set-confirm'));
  if (options?.fakeTimers) {
    await act(async () => {
      await Promise.resolve();
    });
  } else {
    await waitFor(() => {
      expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent('сохранено');
    });
  }
  expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent('сохранено');
}

describe('SessionWorkoutView', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.mocked(sessionSetApi.upsertSessionSet).mockReset();
    vi.mocked(sessionSetApi.deleteSessionSet).mockReset();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('550e8400-e29b-41d4-a716-446655440099');
  });

  it('shows first exercise name from snapshot and duration timer from endsAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    render(<SessionWorkoutView session={baseSession} />);

    expect(screen.getByText('Жим лёжа')).toBeInTheDocument();
    expect(screen.getByTestId('session-duration-timer')).toHaveTextContent('45:00');
    expect(screen.getByTestId('session-surface')).toHaveClass('surface-session');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('session-duration-timer')).toHaveTextContent('44:00');
  });

  it('shows saved sync indicator initially', () => {
    render(<SessionWorkoutView session={baseSession} />);
    expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent('сохранено');
  });

  it('upserts with client setId and shows saving then saved', async () => {
    let resolveUpsert!: (value: { data: unknown; error: undefined }) => void;
    const upsertPromise = new Promise<{ data: unknown; error: undefined }>((resolve) => {
      resolveUpsert = resolve;
    });
    vi.mocked(sessionSetApi.upsertSessionSet).mockReturnValue(upsertPromise);

    render(<SessionWorkoutView session={baseSession} />);
    fireEvent.click(screen.getByTestId('session-set-confirm'));

    expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent('сохраняется');
    expect(sessionSetApi.upsertSessionSet).toHaveBeenCalledWith(
      'sess_1',
      '550e8400-e29b-41d4-a716-446655440099',
      expect.objectContaining({ sessionExerciseId: 'se_1' }),
    );

    await act(async () => {
      resolveUpsert({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440099',
          sessionId: 'sess_1',
          sessionExerciseId: 'se_1',
          sequenceIndex: 1,
          weightKg: 60,
          reps: 10,
          rpe: 0,
          createdAt: '2026-10-01T10:01:00.000Z',
          updatedAt: '2026-10-01T10:01:00.000Z',
        },
        error: undefined,
      });
      await upsertPromise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent('сохранено');
    });
  });

  it('blocks second confirm while save is in flight', async () => {
    let resolveUpsert!: (value: { data: unknown; error: undefined }) => void;
    const upsertPromise = new Promise<{ data: unknown; error: undefined }>((resolve) => {
      resolveUpsert = resolve;
    });
    vi.mocked(sessionSetApi.upsertSessionSet).mockReturnValue(upsertPromise);

    render(<SessionWorkoutView session={baseSession} />);
    fireEvent.click(screen.getByTestId('session-set-confirm'));
    fireEvent.click(screen.getByTestId('session-set-confirm'));

    expect(sessionSetApi.upsertSessionSet).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpsert({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440099',
          sessionId: 'sess_1',
          sessionExerciseId: 'se_1',
          sequenceIndex: 1,
          weightKg: 60,
          reps: 10,
          rpe: 0,
          createdAt: '2026-10-01T10:01:00.000Z',
          updatedAt: '2026-10-01T10:01:00.000Z',
        },
        error: undefined,
      });
      await upsertPromise;
    });
  });

  it('shows retry indicator and reuses same setId on retry', async () => {
    vi.mocked(sessionSetApi.upsertSessionSet)
      .mockResolvedValueOnce({ data: undefined, error: { error: { code: 'INTERNAL_ERROR' } } })
      .mockResolvedValueOnce({
        data: {
          id: '550e8400-e29b-41d4-a716-446655440099',
          sessionId: 'sess_1',
          sessionExerciseId: 'se_1',
          sequenceIndex: 1,
          weightKg: 60,
          reps: 10,
          rpe: 0,
          createdAt: '2026-10-01T10:01:00.000Z',
          updatedAt: '2026-10-01T10:01:00.000Z',
        },
        error: undefined,
      });

    render(<SessionWorkoutView session={baseSession} />);
    fireEvent.click(screen.getByTestId('session-set-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('session-set-sync-indicator')).toHaveTextContent(
        'не сохранилось, повторить',
      );
    });

    fireEvent.click(screen.getByTestId('session-set-sync-indicator'));

    expect(sessionSetApi.upsertSessionSet).toHaveBeenLastCalledWith(
      'sess_1',
      '550e8400-e29b-41d4-a716-446655440099',
      expect.any(Object),
    );
  });

  it('restores sets from session prop on reload', () => {
    render(
      <SessionWorkoutView
        session={{
          ...baseSession,
          sets: [
            {
              id: 'set_existing',
              sessionId: 'sess_1',
              sessionExerciseId: 'se_1',
              sequenceIndex: 1,
              weightKg: 50,
              reps: 8,
              rpe: null,
              createdAt: '2026-10-01T10:00:00.000Z',
              updatedAt: '2026-10-01T10:00:00.000Z',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('session-set-tape')).toBeInTheDocument();
    expect(screen.getByText(/#1/)).toBeInTheDocument();
  });

  it('starts rest timer after solo exercise set is saved', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    vi.mocked(sessionSetApi.upsertSessionSet).mockResolvedValue({
      data: savedSetPayload,
      error: undefined,
    });

    render(<SessionWorkoutView session={baseSession} />);
    await confirmSetAndWait({ fakeTimers: true });

    expect(screen.getByTestId('session-rest-timer')).toBeInTheDocument();
    expect(screen.getByTestId('session-rest-timer-label')).toHaveTextContent('1:30');
    expect(screen.getByTestId('session-set-logger')).toBeInTheDocument();
  });

  it('skips rest and +30 extends endsAt from wall clock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    vi.mocked(sessionSetApi.upsertSessionSet).mockResolvedValue({
      data: savedSetPayload,
      error: undefined,
    });

    render(<SessionWorkoutView session={baseSession} />);
    await confirmSetAndWait({ fakeTimers: true });

    fireEvent.click(screen.getByTestId('session-rest-extend'));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('session-rest-timer-label')).toHaveTextContent('1:00');

    fireEvent.click(screen.getByTestId('session-rest-skip'));
    expect(screen.queryByTestId('session-rest-timer')).not.toBeInTheDocument();
  });

  it('mid-superset advances exercise without rest timer', async () => {
    vi.mocked(sessionSetApi.upsertSessionSet).mockResolvedValue({
      data: savedSetPayload,
      error: undefined,
    });

    const supersetSession = {
      ...baseSession,
      exercises: [
        {
          id: 'se_1',
          sessionId: 'sess_1',
          exerciseId: 'ex_1',
          sortOrder: 0,
          plannedSets: 3,
          plannedReps: 10,
          plannedWeightKg: 60,
          nameSnapshot: 'Жим',
          notes: null,
          supersetGroupId: 'grp_1',
        },
        {
          id: 'se_2',
          sessionId: 'sess_1',
          exerciseId: 'ex_2',
          sortOrder: 1,
          plannedSets: 3,
          plannedReps: 8,
          plannedWeightKg: 40,
          nameSnapshot: 'Тяга',
          notes: null,
          supersetGroupId: 'grp_1',
        },
      ],
    };

    render(<SessionWorkoutView session={supersetSession} />);
    await confirmSetAndWait();

    expect(screen.queryByTestId('session-rest-timer')).not.toBeInTheDocument();
    expect(screen.getByText('Тяга')).toBeInTheDocument();
    expect(document.querySelector('.surface-session__exercise-card--selected')).toHaveTextContent(
      'Тяга',
    );
  });

  it('starts rest after last exercise in superset round', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    vi.mocked(sessionSetApi.upsertSessionSet).mockImplementation(async (_sid, _id, body) => ({
      data: {
        ...savedSetPayload,
        sessionExerciseId: body.sessionExerciseId,
      },
      error: undefined,
    }));

    const supersetSession = {
      ...baseSession,
      exercises: [
        {
          id: 'se_1',
          sessionId: 'sess_1',
          exerciseId: 'ex_1',
          sortOrder: 0,
          plannedSets: 3,
          plannedReps: 10,
          plannedWeightKg: 60,
          nameSnapshot: 'Жим',
          notes: null,
          supersetGroupId: 'grp_1',
        },
        {
          id: 'se_2',
          sessionId: 'sess_1',
          exerciseId: 'ex_2',
          sortOrder: 1,
          plannedSets: 3,
          plannedReps: 8,
          plannedWeightKg: 40,
          nameSnapshot: 'Тяга',
          notes: null,
          supersetGroupId: 'grp_1',
        },
      ],
    };

    render(<SessionWorkoutView session={supersetSession} />);
    await confirmSetAndWait({ fakeTimers: true });
    expect(screen.queryByTestId('session-rest-timer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('session-set-confirm'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('session-rest-timer-label')).toHaveTextContent('1:30');
  });

  it('Enter inside logger confirms set', async () => {
    vi.mocked(sessionSetApi.upsertSessionSet).mockResolvedValue({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440099',
        sessionId: 'sess_1',
        sessionExerciseId: 'se_1',
        sequenceIndex: 1,
        weightKg: 60,
        reps: 10,
        rpe: 0,
        createdAt: '2026-10-01T10:01:00.000Z',
        updatedAt: '2026-10-01T10:01:00.000Z',
      },
      error: undefined,
    });

    render(<SessionWorkoutView session={baseSession} />);
    const logger = screen.getByTestId('session-set-logger');
    fireEvent.keyDown(logger, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(sessionSetApi.upsertSessionSet).toHaveBeenCalledTimes(1);
    });
  });
});
