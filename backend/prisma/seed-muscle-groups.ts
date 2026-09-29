import { PrismaClient } from '@prisma/client';

/** Справочник мышечных групп зала для каталога упражнений (Story 3.1). */
export const SEED_MUSCLE_GROUPS: Array<{ name: string; sortOrder: number }> = [
  { name: 'Грудь', sortOrder: 1 },
  { name: 'Спина', sortOrder: 2 },
  { name: 'Ноги', sortOrder: 3 },
  { name: 'Плечи', sortOrder: 4 },
  { name: 'Руки', sortOrder: 5 },
  { name: 'Кор', sortOrder: 6 },
];

/**
 * Upsert мышечных групп; без паролей и пользователей.
 */
export async function seedMuscleGroups(prisma: PrismaClient): Promise<void> {
  for (const group of SEED_MUSCLE_GROUPS) {
    await prisma.muscleGroup.upsert({
      where: { name: group.name },
      create: { name: group.name, sortOrder: group.sortOrder },
      update: { sortOrder: group.sortOrder },
    });
  }
  console.info(`[seed] Мышечные группы (${SEED_MUSCLE_GROUPS.length}) готовы.`);
}
