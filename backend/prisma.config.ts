import { defineConfig } from 'prisma/config';

/**
 * DATABASE_URL обязателен для migrate/seed/runtime.
 * Для `prisma generate` без .env допустим пустой placeholder без credentials.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://127.0.0.1:5432/quest_fitness?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
