import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { User, UserRole } from '@prisma/client';
import { AppModule } from '../../app.module';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { configureApp } from '../../shared/bootstrap/configure-app';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CLIENT_TEST_PASSWORD,
  createTestClientUser,
  type TestUserRecord,
} from '../../test/auth-test-users';

const TRAINER_PASSWORD = 'TrainerPass1!';

type StoredSession = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
};

type StoredUser = User & { passwordHash: string };

type StoredClientProfile = {
  id: string;
  displayName: string;
  userId: string | null;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredInvite = {
  id: string;
  clientProfileId: string;
  issuedByUserId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sessionCookieHeader(setCookie: string | string[] | undefined): string {
  return (setCookie ?? [])
    .map((raw) => raw.split(';')[0] ?? '')
    .filter(Boolean)
    .join('; ');
}

describe('PublicInvitesController register (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const users = new Map<string, StoredUser>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const invites = new Map<string, StoredInvite>();

  const PLAIN_TOKEN = 'test-invite-token-register-flow';
  const TOKEN_HASH = hashToken(PLAIN_TOKEN);

  function seedValidInvite(overrides?: Partial<Pick<StoredInvite, 'expiresAt' | 'consumedAt' | 'revokedAt'>>) {
    const now = new Date();
    invites.set('inv_register_1', {
      id: 'inv_register_1',
      clientProfileId: 'client_pool_1',
      issuedByUserId: trainerUser.id,
      tokenHash: TOKEN_HASH,
      expiresAt: overrides?.expiresAt ?? new Date(now.getTime() + 60 * 60 * 1000),
      consumedAt: overrides?.consumedAt ?? null,
      revokedAt: overrides?.revokedAt ?? null,
      createdAt: now,
    });
  }

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    $transaction: async <T>(fn: (tx: typeof prismaMock) => Promise<T>): Promise<T> =>
      fn(prismaMock),
    get user() {
      return {
        findFirst: async ({
          where,
        }: {
          where: { OR?: Array<{ login?: string; phoneE164?: string }> };
        }) => {
          if (!where.OR) {
            return null;
          }
          for (const clause of where.OR) {
            if (clause.login !== undefined) {
              const hit = [...users.values()].find((u) => u.login === clause.login);
              if (hit) {
                return hit;
              }
            }
            if (clause.phoneE164 !== undefined) {
              const hit = [...users.values()].find(
                (u) => u.phoneE164 === clause.phoneE164,
              );
              if (hit) {
                return hit;
              }
            }
          }
          return null;
        },
        create: async ({
          data,
        }: {
          data: {
            login: string;
            phoneE164: string;
            passwordHash: string;
            role: UserRole;
          };
        }) => {
          const duplicateLogin = [...users.values()].some((u) => u.login === data.login);
          const duplicatePhone = [...users.values()].some(
            (u) => u.phoneE164 === data.phoneE164,
          );
          if (duplicateLogin || duplicatePhone) {
            const err = new Error('Unique constraint') as Error & { code: string };
            err.code = 'P2002';
            throw err;
          }
          const id = `user_${users.size + 1}`;
          const row: StoredUser = {
            id,
            login: data.login,
            phoneE164: data.phoneE164,
            passwordHash: data.passwordHash,
            role: data.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(id, row);
          return { ...row };
        },
      };
    },
    authSession: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          csrfToken: string;
          expiresAt: Date;
        };
      }) => {
        const id = `sess_${sessions.size + 1}`;
        const owner = users.get(data.userId)!;
        const row: StoredSession = {
          id,
          userId: data.userId,
          csrfToken: data.csrfToken,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        };
        sessions.set(id, row);
        return { ...row, user: owner };
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = sessions.get(where.id);
        if (!row) {
          return null;
        }
        if (row.expiresAt.getTime() <= Date.now()) {
          return null;
        }
        const owner = users.get(row.userId)!;
        return { ...row, user: owner };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        sessions.delete(where.id);
        return { id: where.id };
      },
    },
    clientProfile: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return clientProfiles.get(where.id) ?? null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { userId?: string; displayName?: string };
      }) => {
        const row = clientProfiles.get(where.id);
        if (!row) {
          throw new Error('not found');
        }
        if (data.userId !== undefined) {
          row.userId = data.userId;
        }
        if (data.displayName !== undefined) {
          row.displayName = data.displayName;
        }
        row.updatedAt = new Date();
        return { ...row };
      },
    },
    invite: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        return (
          [...invites.values()].find((i) => i.tokenHash === where.tokenHash) ?? null
        );
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id?: string;
          tokenHash?: string;
          consumedAt?: null;
          revokedAt?: null;
        };
        data: { consumedAt?: Date; revokedAt?: Date };
      }) => {
        let count = 0;
        for (const inv of invites.values()) {
          if (where.id !== undefined && inv.id !== where.id) {
            continue;
          }
          if (where.tokenHash !== undefined && inv.tokenHash !== where.tokenHash) {
            continue;
          }
          if (where.consumedAt === null && inv.consumedAt !== null) {
            continue;
          }
          if (where.revokedAt === null && inv.revokedAt !== null) {
            continue;
          }
          if (data.consumedAt !== undefined) {
            inv.consumedAt = data.consumedAt;
          }
          if (data.revokedAt !== undefined) {
            inv.revokedAt = data.revokedAt;
          }
          count += 1;
        }
        return { count };
      },
    },
  };

  beforeAll(async () => {
    const trainerHash = await argon2.hash(TRAINER_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    trainerUser = {
      id: 'user_trainer_1',
      login: 'traineruser',
      phoneE164: null,
      passwordHash: trainerHash,
      role: UserRole.TRAINER,
    };
    clientUser = await createTestClientUser();
    users.set(clientUser.id, {
      ...clientUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sessions.clear();
    users.clear();
    users.set(clientUser.id, {
      ...clientUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    clientProfiles.clear();
    invites.clear();
    const now = new Date();
    clientProfiles.set('client_pool_1', {
      id: 'client_pool_1',
      displayName: 'Пуловой клиент',
      userId: null,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    seedValidInvite();
  });

  const registerBody = {
    name: 'Новый Клиент',
    phone: '9161234568',
    login: 'new_client_user',
    password: 'SecurePass1!',
  };

  it('consumes invite once and creates CLIENT session', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/invites/${PLAIN_TOKEN}/register`)
      .send(registerBody);

    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeTypeOf('string');
    expect(sessionCookieHeader(res.headers['set-cookie'])).toMatch(/qf_session=/);

    const invite = invites.get('inv_register_1');
    expect(invite?.consumedAt).toBeInstanceOf(Date);

    const created = [...users.values()].find((u) => u.login === 'new_client_user');
    expect(created?.role).toBe(UserRole.CLIENT);
    expect(created?.phoneE164).toBe('+79161234568');

    const profile = clientProfiles.get('client_pool_1');
    expect(profile?.userId).toBe(created?.id);
    expect(profile?.displayName).toBe('Новый Клиент');

    const passwordOk = await argon2.verify(
      created!.passwordHash,
      registerBody.password,
    );
    expect(passwordOk).toBe(true);
  });

  it('second register with same token returns INVITE_ALREADY_CONSUMED', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/invites/${PLAIN_TOKEN}/register`)
      .send(registerBody);
    expect(first.status).toBe(200);

    const second = await request(app.getHttpServer())
      .post(`/api/invites/${PLAIN_TOKEN}/register`)
      .send({
        ...registerBody,
        login: 'another_login',
        phone: '9161234569',
      });

    expect(second.status).toBe(409);
    expect(second.body.error?.code).toBe(ErrorCode.INVITE_ALREADY_CONSUMED);
  });

  it('expired invite returns INVITE_EXPIRED', async () => {
    invites.clear();
    seedValidInvite({
      expiresAt: new Date(Date.now() - 60_000),
    });

    const res = await request(app.getHttpServer())
      .post(`/api/invites/${PLAIN_TOKEN}/register`)
      .send(registerBody);

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.INVITE_EXPIRED);
  });
});
