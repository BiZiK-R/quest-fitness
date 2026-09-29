import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  hashAdminPassword,
  readAdminSeedCredentials,
} from './seed-credentials';

/**
 * Создаёт администратора из SEED_ADMIN_LOGIN / SEED_ADMIN_PASSWORD.
 * Без обеих переменных seed пропускает создание (без дефолтного пароля в репо).
 */
async function main(): Promise<void> {
  const credentials = readAdminSeedCredentials();
  if (!credentials) {
    console.warn(
      '[seed] Пропуск администратора: задайте SEED_ADMIN_LOGIN и SEED_ADMIN_PASSWORD в окружении.',
    );
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[seed] DATABASE_URL is required when seeding admin user');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
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
