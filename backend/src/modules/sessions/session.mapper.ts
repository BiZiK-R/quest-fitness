import { Prisma, Session, SessionExercise } from '@prisma/client';
import { SessionExerciseDto } from './dto/session-exercise.dto';
import { SessionDto } from './dto/session.dto';

type SessionExerciseRow = SessionExercise & {
  plannedWeightKg: Prisma.Decimal | null;
};

type SessionRow = Session & {
  exercises?: SessionExerciseRow[];
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}

export function toSessionExerciseDto(row: SessionExerciseRow): SessionExerciseDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    exerciseId: row.exerciseId,
    sortOrder: row.sortOrder,
    plannedSets: row.plannedSets,
    plannedReps: row.plannedReps,
    plannedWeightKg: decimalToNumber(row.plannedWeightKg),
    nameSnapshot: row.nameSnapshot,
    notes: row.notes,
  };
}

export function toSessionDto(row: SessionRow): SessionDto {
  const exercises = (row.exercises ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toSessionExerciseDto);

  return {
    id: row.id,
    workoutId: row.workoutId,
    clientProfileId: row.clientProfileId,
    authorTrainerId: row.authorTrainerId,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    abandonedAt: row.abandonedAt?.toISOString() ?? null,
    plannedDurationMinutes: row.plannedDurationMinutes ?? 60,
    exercises,
  };
}
