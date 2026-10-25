import type { components } from '@/shared/api/schema';

type ExerciseDto = components['schemas']['ExerciseDto'];

export const NO_GROUPS_WARNING = 'Без групп упражнение не попадёт в статистику мышц';

/** Подпись строки каталога: «Грудь · ещё 2» / «Без мышечных групп». */
export function exerciseMeta(exercise: ExerciseDto, groupNameById: Map<string, string>): string {
  if (exercise.missingMuscleGroupsWarning) {
    return 'Без мышечных групп';
  }
  const primaryName = exercise.primaryMuscleGroupId
    ? groupNameById.get(exercise.primaryMuscleGroupId)
    : undefined;
  const secondaryCount = exercise.secondaryMuscleGroupIds.length;
  if (!primaryName) {
    return `Доп. групп: ${secondaryCount}`;
  }
  return secondaryCount > 0 ? `${primaryName} · ещё ${secondaryCount}` : primaryName;
}
