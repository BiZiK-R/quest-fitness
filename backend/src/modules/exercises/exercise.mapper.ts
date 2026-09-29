import { Exercise, ExerciseMuscle, ExerciseMuscleRole } from '@prisma/client';
import { ExerciseDto } from './dto/exercise.dto';

type ExerciseWithMuscles = Exercise & { muscles: ExerciseMuscle[] };

/**
 * Собирает DTO упражнения и флаг предупреждения об отсутствии групп.
 */
export function toExerciseDto(row: ExerciseWithMuscles): ExerciseDto {
  const muscles = row.muscles ?? [];
  const primary = muscles.find((m) => m.role === ExerciseMuscleRole.PRIMARY);
  const secondaryIds = muscles
    .filter((m) => m.role === ExerciseMuscleRole.SECONDARY)
    .map((m) => m.muscleGroupId);

  const hasGroups = Boolean(primary) || secondaryIds.length > 0;

  return {
    id: row.id,
    name: row.name,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    missingMuscleGroupsWarning: !hasGroups,
    primaryMuscleGroupId: primary?.muscleGroupId ?? null,
    secondaryMuscleGroupIds: secondaryIds,
  };
}
