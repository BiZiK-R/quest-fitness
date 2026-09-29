import { Prisma, Session, SessionExercise, Set } from '@prisma/client';
import { SessionExerciseDto } from './dto/session-exercise.dto';
import { SessionDto } from './dto/session.dto';
import { SetDto } from './dto/set.dto';

type SessionExerciseRow = SessionExercise & {
  plannedWeightKg: Prisma.Decimal | null;
};

type SetRow = Set & {
  weightKg: Prisma.Decimal | null;
  rpe: Prisma.Decimal | null;
};

type SessionRow = Session & {
  exercises?: SessionExerciseRow[];
  sets?: SetRow[];
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}

export function toSetDto(row: SetRow): SetDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    sessionExerciseId: row.sessionExerciseId,
    sequenceIndex: row.sequenceIndex,
    weightKg: decimalToNumber(row.weightKg),
    reps: row.reps,
    rpe: decimalToNumber(row.rpe),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

  const sets = (row.sets ?? [])
    .slice()
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    .map(toSetDto);

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
    sets,
  };
}
