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
import { SESSION_COOKIE_NAME } from '../auth/auth.constants';

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

describe('ClientsController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();

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
  });

  it('trainer creates client profile in pool without owner field', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const createRes = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ displayName: 'Иван Пуловой' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.displayName).toBe('Иван Пуловой');
    expect(createRes.body.id).toBeTypeOf('string');
    expect(createRes.body).not.toHaveProperty('ownerTrainerId');
    expect(Object.keys(createRes.body)).not.toContain('ownerTrainerId');
  });

  it('list includes created clients for trainer', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .post('/api/clients')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ displayName: 'Клиент А' });

    const listRes = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.clients).toHaveLength(1);
    expect(listRes.body.clients[0].displayName).toBe('Клиент А');
    expect(listRes.body.clients[0]).not.toHaveProperty('ownerTrainerId');
  });

  it('client role cannot create client (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const createRes = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ displayName: 'Запрещено' });

    expect(createRes.status).toBe(403);
    expect(createRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('client role cannot list pool (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const listRes = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(listRes.status).toBe(403);
    expect(listRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('sets session cookie on login (sanity)', () => {
    expect(SESSION_COOKIE_NAME).toBe('qf_session');
  });
});
