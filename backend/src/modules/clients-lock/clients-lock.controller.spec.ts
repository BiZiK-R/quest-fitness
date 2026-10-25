import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
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
import { CLIENT_LOCK_IDLE_TTL_MS } from './client-lock.constants';

const TRAINER_PASSWORD = 'TrainerPass1!';
const TRAINER2_PASSWORD = 'Trainer2Pass1!';
const ADMIN_PASSWORD = 'AdminPass1!';

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

describe('ClientsLockController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let trainer2User: TestUserRecord;
  let adminUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const clientLocks = new Map<string, StoredClientLock>();

  const allUsers = () => [trainerUser, trainer2User, adminUser, clientUser];

  const usersById = () => new Map(allUsers().map((u) => [u.id, u as User]));

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
      findMany: async ({ where }: { where?: { id?: { in: string[] } } }) => {
        const ids = new Set(where?.id?.in ?? []);
        return users.filter((u) => ids.has(u.id));
      },
    };
  }

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    $queryRaw: async () => {
      throw new Error('$queryRaw not used in HTTP lock tests');
    },
    $transaction: async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    get user() {
      return buildUserLookup(allUsers());
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
      create: async ({
        data,
      }: {
        data: { displayName: string };
      }) => {
        const now = new Date();
        const id = `client_${clientProfiles.size + 1}`;
        const row: StoredClientProfile = {
          id,
          displayName: data.displayName,
          userId: null,
          deactivatedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        clientProfiles.set(id, row);
        return { ...row };
      },
      findMany: async () => {
        return [...clientProfiles.values()].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return clientProfiles.get(where.id) ?? null;
      },
    },
    clientLock: {
      findUnique: async ({ where }: { where: { clientId: string } }) => {
        return clientLocks.get(where.clientId) ?? null;
      },
      findMany: async ({
        where,
      }: {
        where?: { clientId?: { in: string[] } };
      }) => {
        let rows = [...clientLocks.values()];
        if (where?.clientId?.in) {
          const set = new Set(where.clientId.in);
          rows = rows.filter((r) => set.has(r.clientId));
        }
        return rows;
      },
      create: async ({
        data,
      }: {
        data: {
          clientId: string;
          holderTrainerId: string;
          lastActivityAt: Date;
          activeSessionId?: string | null;
        };
      }) => {
        if (clientLocks.has(data.clientId)) {
          throw new Error('Unique constraint');
        }
        const row: StoredClientLock = {
          clientId: data.clientId,
          holderTrainerId: data.holderTrainerId,
          lastActivityAt: data.lastActivityAt,
          activeSessionId: data.activeSessionId ?? null,
          createdAt: new Date(),
        };
        clientLocks.set(data.clientId, row);
        return { ...row };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          clientId: string;
          OR?: Array<
            | { holderTrainerId: string }
            | { lastActivityAt: { lt: Date } }
          >;
        };
        data: { holderTrainerId: string; lastActivityAt: Date };
      }) => {
        const row = clientLocks.get(where.clientId);
        if (!row) {
          return { count: 0 };
        }
        const now = new Date();
        const stale =
          row.lastActivityAt.getTime() <= now.getTime() - CLIENT_LOCK_IDLE_TTL_MS;
        const self = row.holderTrainerId === data.holderTrainerId;
        const orMatch =
          !where.OR ||
          where.OR.some((clause) => {
            if ('holderTrainerId' in clause) {
              return row.holderTrainerId === clause.holderTrainerId;
            }
            return row.lastActivityAt.getTime() < clause.lastActivityAt.lt.getTime();
          });
        if (!orMatch || (!stale && !self && row.holderTrainerId !== data.holderTrainerId)) {
          return { count: 0 };
        }
        clientLocks.set(where.clientId, {
          ...row,
          holderTrainerId: data.holderTrainerId,
          lastActivityAt: data.lastActivityAt,
        });
        return { count: 1 };
      },
      update: async ({
        where,
        data,
      }: {
        where: { clientId: string };
        data: Partial<Pick<StoredClientLock, 'holderTrainerId' | 'lastActivityAt'>>;
      }) => {
        const row = clientLocks.get(where.clientId);
        if (!row) {
          throw new Error('Lock not found');
        }
        const next = { ...row, ...data };
        clientLocks.set(where.clientId, next);
        return { ...next };
      },
      delete: async ({ where }: { where: { clientId: string } }) => {
        const row = clientLocks.get(where.clientId);
        clientLocks.delete(where.clientId);
        return row ?? { clientId: where.clientId };
      },
    },
    clientMacroProgress: {
      findUnique: async () => null,
    },
    workout: {
      findMany: async () => [],
    },
  };

  beforeAll(async () => {
    const trainerHash = await argon2.hash(TRAINER_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    const trainer2Hash = await argon2.hash(TRAINER2_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    const adminHash = await argon2.hash(ADMIN_PASSWORD, {
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
    trainer2User = {
      id: 'user_trainer_2',
      login: 'traineruser2',
      phoneE164: null,
      passwordHash: trainer2Hash,
      role: UserRole.TRAINER,
    };
    adminUser = {
      id: 'user_admin_1',
      login: 'adminuser',
      phoneE164: null,
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    };
    clientUser = await createTestClientUser();
    sessions.clear();
    clientProfiles.clear();
    clientLocks.clear();

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
  });

  it('acquires lock on free client and returns expiresAt', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const before = Date.now();
    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    const after = Date.now();

    expect(res.status).toBe(201);
    expect(res.body.holderTrainerId).toBe(trainerUser.id);
    expect(res.body.holderDisplayName).toBe(trainerUser.login);
    expect(res.body.expiresAt).toBeTypeOf('string');
    const expiresMs = new Date(res.body.expiresAt as string).getTime();
    expect(expiresMs).toBeGreaterThanOrEqual(before + CLIENT_LOCK_IDLE_TTL_MS - 2000);
    expect(expiresMs).toBeLessThanOrEqual(after + CLIENT_LOCK_IDLE_TTL_MS + 2000);
  });

  it('returns CLIENT_LOCKED when second trainer tries acquire', async () => {
    const t1 = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);
    const t2 = await loginAndGetSession(app, trainer2User.login, TRAINER2_PASSWORD);

    const first = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t1.cookiePairs)
      .set('x-csrf-token', t1.csrfToken);
    expect(first.status).toBe(201);

    const conflict = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t2.cookiePairs)
      .set('x-csrf-token', t2.csrfToken);

    expect(conflict.status).toBe(409);
    expect(conflict.body.error?.code).toBe(ErrorCode.CLIENT_LOCKED);
    expect(conflict.body.error?.details?.holderTrainerId).toBe(trainerUser.id);
    expect(conflict.body.error?.details?.expiresAt).toBeTypeOf('string');
  });

  it('heartbeat refreshes lastActivityAt for holder', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    const stored = clientLocks.get('client_pool_1')!;
    stored.lastActivityAt = new Date(Date.now() - 5 * 60 * 1000);

    const hb = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock/heartbeat')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(hb.status).toBe(200);
    expect(hb.body.expiresAt).toBeTypeOf('string');
    const updated = clientLocks.get('client_pool_1')!;
    expect(updated.lastActivityAt.getTime()).toBeGreaterThan(stored.lastActivityAt.getTime());
  });

  it('release removes lock for holder', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    const del = await request(app.getHttpServer())
      .delete('/api/clients/client_pool_1/lock')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(del.status).toBe(200);
    expect(clientLocks.has('client_pool_1')).toBe(false);
  });

  it('admin force-unlock clears lock held by trainer', async () => {
    const t1 = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);
    const admin = await loginAndGetSession(app, adminUser.login, ADMIN_PASSWORD);

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t1.cookiePairs)
      .set('x-csrf-token', t1.csrfToken);

    const del = await request(app.getHttpServer())
      .delete('/api/clients/client_pool_1/lock?force=true')
      .set('Cookie', admin.cookiePairs)
      .set('x-csrf-token', admin.csrfToken);

    expect(del.status).toBe(200);
    expect(clientLocks.has('client_pool_1')).toBe(false);
  });

  it('re-acquire succeeds when previous lock is stale (>30m idle)', async () => {
    const t1 = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);
    const t2 = await loginAndGetSession(app, trainer2User.login, TRAINER2_PASSWORD);

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t1.cookiePairs)
      .set('x-csrf-token', t1.csrfToken);

    const staleAt = new Date(Date.now() - CLIENT_LOCK_IDLE_TTL_MS - 1000);
    clientLocks.set('client_pool_1', {
      clientId: 'client_pool_1',
      holderTrainerId: trainerUser.id,
      lastActivityAt: staleAt,
      activeSessionId: null,
      createdAt: staleAt,
    });

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t2.cookiePairs)
      .set('x-csrf-token', t2.csrfToken);

    expect(res.status).toBe(201);
    expect(res.body.holderTrainerId).toBe(trainer2User.id);
  });

  it('GET client includes live lockStatus without acquiring', async () => {
    const t1 = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);
    const t2 = await loginAndGetSession(app, trainer2User.login, TRAINER2_PASSWORD);

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t1.cookiePairs)
      .set('x-csrf-token', t1.csrfToken);

    const getRes = await request(app.getHttpServer())
      .get('/api/clients/client_pool_1')
      .set('Cookie', t2.cookiePairs)
      .set('x-csrf-token', t2.csrfToken);

    expect(getRes.status).toBe(200);
    expect(getRes.body.lockStatus).toEqual({
      holderTrainerId: trainerUser.id,
      holderDisplayName: trainerUser.login,
      expiresAt: expect.any(String),
    });
    expect(clientLocks.size).toBe(1);
  });

  it('GET pool list includes holderDisplayName for locked client', async () => {
    const t1 = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);
    const t2 = await loginAndGetSession(app, trainer2User.login, TRAINER2_PASSWORD);

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/lock')
      .set('Cookie', t1.cookiePairs)
      .set('x-csrf-token', t1.csrfToken);

    const listRes = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Cookie', t2.cookiePairs)
      .set('x-csrf-token', t2.csrfToken);

    expect(listRes.status).toBe(200);
    const locked = (
      listRes.body.clients as Array<{ id: string; lockStatus: unknown }>
    ).find((client) => client.id === 'client_pool_1');
    expect(locked?.lockStatus).toEqual({
      holderTrainerId: trainerUser.id,
      holderDisplayName: trainerUser.login,
      expiresAt: expect.any(String),
    });
  });

  it('GET client returns null lockStatus when lock expired', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const staleAt = new Date(Date.now() - CLIENT_LOCK_IDLE_TTL_MS - 1000);
    clientLocks.set('client_pool_1', {
      clientId: 'client_pool_1',
      holderTrainerId: trainerUser.id,
      lastActivityAt: staleAt,
      activeSessionId: null,
      createdAt: staleAt,
    });

    const getRes = await request(app.getHttpServer())
      .get('/api/clients/client_pool_1')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(getRes.status).toBe(200);
    expect(getRes.body.lockStatus).toBeNull();
  });

  it('invite without lock returns LOCK_REQUIRED', async () => {
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
});
