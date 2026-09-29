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

const TRAINER_PASSWORD = 'TrainerPass1!';

type StoredSession = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
};

type StoredSetModifier = {
  id: string;
  name: string;
  colorToken: string;
  isPreset: boolean;
  archivedAt: Date | null;
  createdByUserId: string | null;
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

describe('ModifiersController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const authSessions = new Map<string, StoredSession>();
  const modifiers = new Map<string, StoredSetModifier>();

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
        const id = data.id ?? `auth_sess_${authSessions.size + 1}`;
        const owner = usersById().get(data.userId) as User;
        const row: StoredSession = {
          id,
          userId: data.userId,
          csrfToken: data.csrfToken,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        };
        authSessions.set(id, row);
        return { ...row, user: owner };
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = authSessions.get(where.id);
        if (!row || row.expiresAt.getTime() <= Date.now()) {
          return null;
        }
        const owner = usersById().get(row.userId) as User;
        return { ...row, user: owner };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        authSessions.delete(where.id);
        return { id: where.id };
      },
    },
    setModifier: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { archivedAt?: null };
        orderBy?: { name: 'asc' };
      }) => {
        let rows = [...modifiers.values()];
        if (where?.archivedAt === null) {
          rows = rows.filter((m) => m.archivedAt === null);
        }
        if (orderBy?.name === 'asc') {
          rows.sort((a, b) => a.name.localeCompare(b.name));
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        modifiers.get(where.id) ?? null,
      create: async ({
        data,
      }: {
        data: {
          name: string;
          colorToken: string;
          isPreset: boolean;
          createdByUserId?: string | null;
        };
      }) => {
        const now = new Date();
        const id = `mod_${modifiers.size + 1}`;
        const row: StoredSetModifier = {
          id,
          name: data.name,
          colorToken: data.colorToken,
          isPreset: data.isPreset,
          archivedAt: null,
          createdByUserId: data.createdByUserId ?? null,
          createdAt: now,
          updatedAt: now,
        };
        modifiers.set(id, row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { archivedAt?: Date; updatedAt?: Date };
      }) => {
        const row = modifiers.get(where.id);
        if (!row) {
          throw new Error('missing');
        }
        const updated = {
          ...row,
          ...data,
          updatedAt: data.updatedAt ?? new Date(),
        };
        modifiers.set(where.id, updated);
        return updated;
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
    authSessions.clear();
    modifiers.clear();
    modifiers.set('preset_1', {
      id: 'preset_1',
      name: 'Разминка',
      colorToken: 'mod-amber',
      isPreset: true,
      archivedAt: null,
      createdByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('lists active modifiers excluding archived', async () => {
    modifiers.set('archived_1', {
      id: 'archived_1',
      name: 'Старое',
      colorToken: 'mod-sky',
      isPreset: false,
      archivedAt: new Date(),
      createdByUserId: trainerUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/modifiers')
      .set('Cookie', cookiePairs)
      .set('X-CSRF-Token', csrfToken);

    expect(res.status).toBe(200);
    const ids = (res.body.modifiers as Array<{ id: string }>).map((m) => m.id);
    expect(ids).toContain('preset_1');
    expect(ids).not.toContain('archived_1');
  });

  it('creates custom modifier with palette colorToken', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/modifiers')
      .set('Cookie', cookiePairs)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Дроп-сет', colorToken: 'mod-teal' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Дроп-сет');
    expect(res.body.colorToken).toBe('mod-teal');
    expect(res.body.isPreset).toBe(false);
  });

  it('rejects unknown colorToken on create', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/modifiers')
      .set('Cookie', cookiePairs)
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Bad', colorToken: '#ff0000' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('soft-archives modifier via POST archive', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const archiveRes = await request(app.getHttpServer())
      .post('/api/modifiers/preset_1/archive')
      .set('Cookie', cookiePairs)
      .set('X-CSRF-Token', csrfToken);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.archivedAt).toBeTruthy();

    const listRes = await request(app.getHttpServer())
      .get('/api/modifiers')
      .set('Cookie', cookiePairs)
      .set('X-CSRF-Token', csrfToken);

    const ids = (listRes.body.modifiers as Array<{ id: string }>).map((m) => m.id);
    expect(ids).not.toContain('preset_1');
  });
});
