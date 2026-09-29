import { describe, expect, it } from 'vitest';
import { buildSessionSummary } from './session-summary.builder';

describe('buildSessionSummary', () => {
  it('aggregates set count and tonnage with firstTime when no prior session', () => {
    const summary = buildSessionSummary({
      sessionId: 'sess_2',
      exercises: [
        {
          id: 'se_2',
          exerciseId: 'ex_1',
          sortOrder: 0,
          nameSnapshot: 'Жим',
        },
      ],
      sets: [
        {
          sessionExerciseId: 'se_2',
          weightKg: { toNumber: () => 50 } as never,
          reps: 10,
        },
      ],
      priorCompletedSessions: [],
    });

    expect(summary.setCount).toBe(1);
    expect(summary.totalTonnageKg).toBe(500);
    expect(summary.perExercise[0].firstTime).toBe(true);
    expect(summary.perExercise[0].growthPercent).toBeNull();
  });

  it('computes growth vs last completed session for same exerciseId', () => {
    const summary = buildSessionSummary({
      sessionId: 'sess_2',
      exercises: [
        {
          id: 'se_2',
          exerciseId: 'ex_1',
          sortOrder: 0,
          nameSnapshot: 'Жим',
        },
      ],
      sets: [
        {
          sessionExerciseId: 'se_2',
          weightKg: { toNumber: () => 55 } as never,
          reps: 10,
        },
      ],
      priorCompletedSessions: [
        {
          exercises: [
            {
              id: 'se_1',
              exerciseId: 'ex_1',
              sortOrder: 0,
              nameSnapshot: 'Жим',
            },
          ],
          sets: [
            {
              sessionExerciseId: 'se_1',
              weightKg: { toNumber: () => 50 } as never,
              reps: 10,
            },
          ],
        },
      ],
    });

    expect(summary.perExercise[0].firstTime).toBe(false);
    expect(summary.perExercise[0].growthPercent).toBe(10);
  });
});
