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

type StoredClientLock = {
  clientId: string;
  holderTrainerId: string;
  lastActivityAt: Date;
  activeSessionId: string | null;
  createdAt: Date;
};

function sessionCookieHeader(setCookie: string | string[] | undefined): string {
  return (setCookie ?? [])
    .map((raw) => raw.split(';')[0] ?? '')
    .filter(Boolean)
    .join('; ');
}

async function loginAndGetSession(
  app: INestApplication,
  login: string,
  password: string,
): Promise<{ csrfToken: string; cookiePairs: string }> {
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ login, password });

  expect(loginRes.status).toBe(200);
  return {
    csrfToken: loginRes.body.csrfToken as string,
    cookiePairs: sessionCookieHeader(loginRes.headers['set-cookie']),
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

describe('InvitesController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const invites = new Map<string, StoredInvite>();
  const clientLocks = new Map<string, StoredClientLock>();

  const usersById = () =>
    new Map([trainerUser, clientUser].map((u) => [u.id, u as User]));

  function buildUserLookup(users: TestUserRecord[]) {
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
            const hit = users.find((u) => u.login === clause.login);
            if (hit) {
              return hit;
            }
          }
          if (clause.phoneE164 !== undefined) {
            const hit = users.find((u) => u.phoneE164 === clause.phoneE164);
            if (hit) {
              return hit;
            }
          }
        }
        return null;
      },
      findUnique: async ({
        where,
      }: {
        where: { login?: string; id?: string };
      }) => {
        if (where.login !== undefined) {
          return users.find((u) => u.login === where.login) ?? null;
        }
        if (where.id !== undefined) {
          return users.find((u) => u.id === where.id) ?? null;
        }
        return null;
      },
    };
  }

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    get user() {
      return buildUserLookup([trainerUser, clientUser]);
    },
    authSession: {
      create: async ({
        data,
      }: {
        data: {
          id?: string;
          userId: string;
          csrfToken: string;
          expiresAt: Date;
        };
      }) => {
        const id = data.id ?? `sess_${sessions.size + 1}`;
        const owner = usersById().get(data.userId) as User;
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
        const owner = usersById().get(row.userId) as User;
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
    },
    clientLock: {
      findUnique: async ({ where }: { where: { clientId: string } }) => {
        return clientLocks.get(where.clientId) ?? null;
      },
    },
    invite: {
      create: async ({
        data,
      }: {
        data: {
          clientProfileId: string;
          issuedByUserId: string;
          tokenHash: string;
          expiresAt: Date;
        };
      }) => {
        const id = `inv_${invites.size + 1}`;
        const row: StoredInvite = {
          id,
          clientProfileId: data.clientProfileId,
          issuedByUserId: data.issuedByUserId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          consumedAt: null,
          revokedAt: null,
          createdAt: new Date(),
        };
        invites.set(id, row);
        return { ...row };
      },
      findFirst: async ({
        where,
        orderBy,
      }: {
        where: {
          clientProfileId: string;
          revokedAt?: null;
          consumedAt?: null;
          expiresAt?: { gt: Date };
        };
        orderBy?: { createdAt: 'desc' };
      }) => {
        const now = new Date();
        const candidates = [...invites.values()].filter((inv) => {
          if (inv.clientProfileId !== where.clientProfileId) {
            return false;
          }
          if (where.revokedAt === null && inv.revokedAt !== null) {
            return false;
          }
          if (where.consumedAt === null && inv.consumedAt !== null) {
            return false;
          }
          if (where.expiresAt?.gt && inv.expiresAt.getTime() <= where.expiresAt.gt.getTime()) {
            return false;
          }
          return true;
        });
        if (orderBy?.createdAt === 'desc') {
          candidates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return candidates[0] ?? null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          clientProfileId: string;
          revokedAt?: null;
          consumedAt?: null;
        };
        data: { revokedAt: Date };
      }) => {
        let count = 0;
        for (const inv of invites.values()) {
          if (inv.clientProfileId !== where.clientProfileId) {
            continue;
          }
          if (where.revokedAt === null && inv.revokedAt !== null) {
            continue;
          }
          if (where.consumedAt === null && inv.consumedAt !== null) {
            continue;
          }
          inv.revokedAt = data.revokedAt;
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
    sessions.clear();
    clientProfiles.clear();
    invites.clear();

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
    clientProfiles.clear();
    invites.clear();
    clientLocks.clear();
    const now = new Date();
    clientProfiles.set('client_pool_1', {
      id: 'client_pool_1',
      displayName: 'Пуловой клиент',
      userId: null,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    clientLocks.set('client_pool_1', {
      clientId: 'client_pool_1',
      holderTrainerId: trainerUser.id,
      lastActivityAt: now,
      activeSessionId: null,
      createdAt: now,
    });
  });

  it('issue without live lock returns LOCK_REQUIRED', async () => {
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const issueRes = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(issueRes.status).toBe(409);
    expect(issueRes.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('issue stores sha256 hash not plaintext token', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const issueRes = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(issueRes.status).toBe(201);
    const plainToken = issueRes.body.token as string;
    expect(plainToken).toBeTypeOf('string');
    expect(plainToken.length).toBeGreaterThan(16);

    const stored = [...invites.values()].find(
      (i) => i.clientProfileId === 'client_pool_1',
    );
    expect(stored).toBeDefined();
    expect(stored!.tokenHash).toBe(hashToken(plainToken));
    expect(stored!.tokenHash).not.toBe(plainToken);
    expect(issueRes.body.inviteUrl).toBe(`/invite/${plainToken}`);
  });

  it('expiresAt is approximately one day from issue', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const before = Date.now();
    const issueRes = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    const after = Date.now();

    expect(issueRes.status).toBe(201);
    const expiresMs = new Date(issueRes.body.expiresAt as string).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(expiresMs - before).toBeGreaterThanOrEqual(oneDayMs - 5000);
    expect(expiresMs - after).toBeLessThanOrEqual(oneDayMs + 5000);
    expect(issueRes.body.expiresAtLabel).toBeTypeOf('string');
    expect((issueRes.body.expiresAtLabel as string).length).toBeGreaterThan(0);
  });

  it('reissue revokes previous active invite', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const first = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    expect(first.status).toBe(201);
    const firstHash = hashToken(first.body.token as string);

    const second = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    expect(second.status).toBe(201);
    expect(second.body.token).not.toBe(first.body.token);

    const firstRow = [...invites.values()].find((i) => i.tokenHash === firstHash);
    const secondRow = [...invites.values()].find(
      (i) => i.tokenHash === hashToken(second.body.token as string),
    );
    expect(firstRow?.revokedAt).toBeInstanceOf(Date);
    expect(secondRow?.revokedAt).toBeNull();
  });

  it('client role cannot issue invite (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const issueRes = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/invites')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(issueRes.status).toBe(403);
    expect(issueRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
