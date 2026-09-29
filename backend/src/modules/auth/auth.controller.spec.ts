import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../../app.module';
import { configureApp } from '../../shared/bootstrap/configure-app';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SESSION_COOKIE_NAME } from './auth.constants';

const TEST_PASSWORD = 'SecretPass1!';

type StoredUser = {
  id: string;
  login: string;
  passwordHash: string;
  role: UserRole;
};

type StoredSession = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
};

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let passwordHash: string;
  let adminUser: StoredUser;
  const sessions = new Map<string, StoredSession>();

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    user: {
      findUnique: async ({
        where,
      }: {
        where: { login?: string; id?: string };
      }) => {
        if (where.login !== undefined) {
          return where.login === adminUser.login ? adminUser : null;
        }
        if (where.id !== undefined) {
          return where.id === adminUser.id ? adminUser : null;
        }
        return null;
      },
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
        const row: StoredSession = {
          id,
          userId: data.userId,
          csrfToken: data.csrfToken,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        };
        sessions.set(id, row);
        return { ...row, user: adminUser };
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = sessions.get(where.id);
        if (!row) {
          return null;
        }
        if (row.expiresAt.getTime() <= Date.now()) {
          return null;
        }
        return {
          ...row,
          user: adminUser,
        };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        sessions.delete(where.id);
        return { id: where.id };
      },
    },
  };

  beforeAll(async () => {
    passwordHash = await argon2.hash(TEST_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    adminUser = {
      id: 'user_admin_1',
      login: 'adminuser',
      passwordHash,
      role: UserRole.ADMIN,
    };
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
    const cookiePairs = (loginRes.headers['set-cookie'] ?? [])
      .map((raw) => raw.split(';')[0] ?? '')
      .filter(Boolean)
      .join('; ');

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

    const cookiePairs = (loginRes.headers['set-cookie'] ?? [])
      .map((raw) => raw.split(';')[0] ?? '')
      .filter(Boolean)
      .join('; ');

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
