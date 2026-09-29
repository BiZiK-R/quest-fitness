import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

/**
 * Читает SEED_ADMIN_* без дефолтного пароля. Пустые значения → null (пропуск seed).
 */
export function readAdminSeedCredentials(
  env: NodeJS.ProcessEnv = process.env,
): { login: string; password: string } | null {
  const login = env.SEED_ADMIN_LOGIN?.trim().toLowerCase();
  const password = env.SEED_ADMIN_PASSWORD;
  if (!login || !password) {
    return null;
  }
  return { login, password };
}

/** Хеш пароля админа (argon2id, memoryCost ≥ 65536). */
export async function hashAdminPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}
