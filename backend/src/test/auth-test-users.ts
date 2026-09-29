import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';

export const CLIENT_TEST_PASSWORD = 'ClientPass1!';

export type TestUserRecord = {
  id: string;
  login: string;
  phoneE164: string | null;
  passwordHash: string;
  role: UserRole;
};

/**
 * Создаёт запись клиента для HTTP-тестов (известный пароль, не в seed).
 */
export async function createTestClientUser(
  overrides?: Partial<Pick<TestUserRecord, 'id' | 'login' | 'phoneE164'>>,
): Promise<TestUserRecord> {
  const passwordHash = await argon2.hash(CLIENT_TEST_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
  });

  return {
    id: overrides?.id ?? 'user_client_1',
    login: overrides?.login ?? 'clientuser',
    phoneE164: overrides?.phoneE164 ?? '+79161234567',
    passwordHash,
    role: UserRole.CLIENT,
  };
}
