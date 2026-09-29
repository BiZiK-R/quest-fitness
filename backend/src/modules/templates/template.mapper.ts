import { Prisma } from '@prisma/client';
import { TemplateExerciseDto } from './dto/template-exercise.dto';
import { WorkoutTemplateDto } from './dto/workout-template.dto';

type TemplateExerciseRow = {
  id: string;
  exerciseId: string;
  sortOrder: number;
  plannedSets: number | null;
  plannedReps: number | null;
  plannedWeightKg: Prisma.Decimal | null;
  notes: string | null;
  supersetGroupId: string | null;
  exercise?: { name: string } | null;
};

type WorkoutTemplateRow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  durationMinutes: number | null;
  microcycleWeeks: number | null;
  version: number;
  archivedAt: Date | null;
  exercises?: TemplateExerciseRow[];
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}

function toTemplateExerciseDto(row: TemplateExerciseRow): TemplateExerciseDto {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    exerciseName: row.exercise?.name ?? null,
    sortOrder: row.sortOrder,
    plannedSets: row.plannedSets,
    plannedReps: row.plannedReps,
    plannedWeightKg: decimalToNumber(row.plannedWeightKg),
    notes: row.notes,
    supersetGroupId: row.supersetGroupId,
  };
}

/** Maps Prisma workout template row to API DTO. */
export function toWorkoutTemplateDto(row: WorkoutTemplateRow): WorkoutTemplateDto {
  const exercises = (row.exercises ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toTemplateExerciseDto);

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    durationMinutes: row.durationMinutes,
    microcycleWeeks: row.microcycleWeeks,
    version: row.version,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    exercises,
  };
}
