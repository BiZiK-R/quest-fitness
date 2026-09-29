import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { User, UserRole } from '@prisma/client';
import { AppModule } from '../../app.module';
import { configureApp } from '../../shared/bootstrap/configure-app';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { normalizePhoneToE164 } from '../../shared/phone/normalize-phone-e164';
import {
  CLIENT_TEST_PASSWORD,
  createTestClientUser,
  type TestUserRecord,
} from '../../test/auth-test-users';
import { SESSION_COOKIE_NAME } from './auth.constants';

const TEST_PASSWORD = 'SecretPass1!';

type StoredSession = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
};

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

function sessionCookieHeader(setCookie: string | string[] | undefined): string {
  return (setCookie ?? [])
    .map((raw) => raw.split(';')[0] ?? '')
    .filter(Boolean)
    .join('; ');
}

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let adminUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const usersById = () => new Map([adminUser, clientUser].map((u) => [u.id, u]));

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    get user() {
      return buildUserLookup([adminUser, clientUser]);
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
        return {
          ...row,
          user: owner,
        };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        sessions.delete(where.id);
        return { id: where.id };
      },
    },
  };

  beforeAll(async () => {
    const passwordHash = await argon2.hash(TEST_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    adminUser = {
      id: 'user_admin_1',
      login: 'adminuser',
      phoneE164: null,
      passwordHash,
      role: UserRole.ADMIN,
    };
    clientUser = await createTestClientUser();
    sessions.clear();

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

  it('login success creates session and sets qf_session cookie', async () => {
    sessions.clear();

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'AdminUser', password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeTypeOf('string');
    expect(sessions.size).toBe(1);

    const setCookie = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie)
      ? setCookie.join(';')
      : String(setCookie ?? '');
    expect(cookieHeader).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookieHeader.toLowerCase()).toContain('httponly');
  });

  it('client login by login creates session', async () => {
    sessions.clear();

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: clientUser.login, password: CLIENT_TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeTypeOf('string');
  });

  it('client login by phone E.164 creates session', async () => {
    sessions.clear();

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: '89161234567', password: CLIENT_TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeTypeOf('string');
  });

  it('after client login /api/auth/me returns role CLIENT', async () => {
    sessions.clear();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: clientUser.login, password: CLIENT_TEST_PASSWORD });

    const csrfToken = loginRes.body.csrfToken as string;
    const cookiePairs = sessionCookieHeader(loginRes.headers['set-cookie']);

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toEqual({
      login: clientUser.login,
      role: 'CLIENT',
    });
  });

  it('client session on trainer ping returns FORBIDDEN_ROLE', async () => {
    sessions.clear();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: clientUser.login, password: CLIENT_TEST_PASSWORD });

    const csrfToken = loginRes.body.csrfToken as string;
    const cookiePairs = sessionCookieHeader(loginRes.headers['set-cookie']);

    const pingRes = await request(app.getHttpServer())
      .get('/api/trainer/ping')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(pingRes.status).toBe(403);
    expect(pingRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('short login returns VALIDATION_FAILED envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'ab', password: TEST_PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('bad password returns UNAUTHENTICATED envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: adminUser.login, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: ErrorCode.UNAUTHENTICATED,
        message: expect.any(String),
      },
    });
  });

  it('logout clears session and cookie when CSRF header is present', async () => {
    sessions.clear();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: adminUser.login, password: TEST_PASSWORD });

    const csrfToken = loginRes.body.csrfToken as string;
    const cookiePairs = sessionCookieHeader(loginRes.headers['set-cookie']);

    expect(sessions.size).toBe(1);
    const sessionId = [...sessions.keys()][0]!;

    const logoutRes = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(logoutRes.status).toBe(200);
    expect(sessions.has(sessionId)).toBe(false);

    const cleared = logoutRes.headers['set-cookie'];
    const clearedStr = Array.isArray(cleared)
      ? cleared.join(';')
      : String(cleared ?? '');
    expect(clearedStr.toLowerCase()).toMatch(/max-age=0|expires=/);
  });

  it('logout without CSRF header is rejected', async () => {
    sessions.clear();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: adminUser.login, password: TEST_PASSWORD });

    const cookiePairs = sessionCookieHeader(loginRes.headers['set-cookie']);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookiePairs);

    expect(logoutRes.status).toBe(403);
    expect(logoutRes.body.error?.code).toBeDefined();
    expect(sessions.size).toBe(1);
  });

  it('does not log password on login attempt', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const debugSpy = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: adminUser.login, password: TEST_PASSWORD });

    const allCalls = [
      ...logSpy.mock.calls,
      ...errorSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...debugSpy.mock.calls,
    ]
      .flat()
      .join(' ');

    expect(allCalls).not.toContain(TEST_PASSWORD);

    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });
});

describe('normalizePhoneToE164 (auth lookup)', () => {
  it('matches client seed phone used in tests', () => {
    expect(normalizePhoneToE164('89161234567')).toBe('+79161234567');
  });
});
