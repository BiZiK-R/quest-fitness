import { describe, expect, it } from 'vitest';
import {
  hashAdminPassword,
  readAdminSeedCredentials,
} from '../../../prisma/seed-credentials';

describe('admin seed credentials', () => {
  it('does not invent a default password when SEED_ADMIN_* are missing', () => {
    expect(
      readAdminSeedCredentials({
        SEED_ADMIN_LOGIN: '',
        SEED_ADMIN_PASSWORD: '',
      }),
    ).toBeNull();
    expect(readAdminSeedCredentials({})).toBeNull();
  });

  it('normalizes login to lowercase when credentials are present', () => {
    expect(
      readAdminSeedCredentials({
        SEED_ADMIN_LOGIN: '  AdminUser ',
        SEED_ADMIN_PASSWORD: 'SecretPass1!',
      }),
    ).toEqual({ login: 'adminuser', password: 'SecretPass1!' });
  });

  it('hashes with argon2id (memoryCost ≥ 65536)', async () => {
    const hash = await hashAdminPassword('SecretPass1!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).toMatch(/m=65536/);
  });
});
