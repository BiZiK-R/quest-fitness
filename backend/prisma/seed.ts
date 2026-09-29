import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  hashAdminPassword,
  readAdminSeedCredentials,
} from './seed-credentials';
import { seedMuscleGroups } from './seed-muscle-groups';

/**
 * Seed: мышечные группы всегда (при DATABASE_URL); админ — только из env (без дефолтного пароля).
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[seed] DATABASE_URL is required');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await seedMuscleGroups(prisma);

    const credentials = readAdminSeedCredentials();
    if (!credentials) {
      console.warn(
        '[seed] Пропуск администратора: задайте SEED_ADMIN_LOGIN и SEED_ADMIN_PASSWORD в окружении.',
      );
      return;
    }

    const passwordHash = await hashAdminPassword(credentials.password);

    await prisma.user.upsert({
      where: { login: credentials.login },
      create: {
        login: credentials.login,
        passwordHash,
        role: UserRole.ADMIN,
      },
      update: {
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.info(`[seed] Администратор «${credentials.login}» готов.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] Ошибка:', error);
  process.exit(1);
});
