import { Prisma } from '@prisma/client';
import { setTonnageKg, tonnageGrowthPercent } from './set-tonnage.util';
import { SessionSummaryDto } from '../dto/session-summary.dto';

type SetRow = {
  sessionExerciseId: string;
  weightKg: Prisma.Decimal | null;
  reps: number | null;
};

type SessionExerciseRow = {
  id: string;
  exerciseId: string;
  sortOrder: number;
  nameSnapshot: string;
};

type PriorSessionRow = {
  exercises: SessionExerciseRow[];
  sets: SetRow[];
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value == null) {
    return null;
  }
  return value.toNumber();
}

function tonnageForExerciseSets(sets: SetRow[], sessionExerciseId: string): { tonnageKg: number; setCount: number } {
  let tonnageKg = 0;
  let setCount = 0;
  for (const set of sets) {
    if (set.sessionExerciseId !== sessionExerciseId) {
      continue;
    }
    setCount += 1;
    tonnageKg += setTonnageKg(
      decimalToNumber(set.weightKg),
      set.reps,
    );
  }
  return { tonnageKg, setCount };
}

function priorTonnageForExercise(
  priorSessions: PriorSessionRow[],
  exerciseId: string,
): number | null {
  for (const prior of priorSessions) {
    const match = prior.exercises.find((e) => e.exerciseId === exerciseId);
    if (!match) {
      continue;
    }
    const { tonnageKg } = tonnageForExerciseSets(prior.sets, match.id);
    return tonnageKg;
  }
  return null;
}

/**
 * Builds session completion summary with per-exercise tonnage and growth (FR-17).
 */
export function buildSessionSummary(params: {
  sessionId: string;
  exercises: SessionExerciseRow[];
  sets: SetRow[];
  priorCompletedSessions: PriorSessionRow[];
}): SessionSummaryDto {
  const sortedExercises = [...params.exercises].sort((a, b) => a.sortOrder - b.sortOrder);

  let totalTonnageKg = 0;
  let setCount = 0;
  const perExercise = sortedExercises.map((exercise) => {
    const { tonnageKg, setCount: exerciseSetCount } = tonnageForExerciseSets(
      params.sets,
      exercise.id,
    );
    totalTonnageKg += tonnageKg;
    setCount += exerciseSetCount;

    const priorTonnage = priorTonnageForExercise(params.priorCompletedSessions, exercise.exerciseId);
    const firstTime = priorTonnage === null;
    const growthPercent = firstTime ? null : tonnageGrowthPercent(tonnageKg, priorTonnage);

    return {
      exerciseId: exercise.exerciseId,
      nameSnapshot: exercise.nameSnapshot,
      setCount: exerciseSetCount,
      tonnageKg,
      growthPercent,
      firstTime,
    };
  });

  return {
    sessionId: params.sessionId,
    setCount,
    totalTonnageKg,
    perExercise,
  };
}
