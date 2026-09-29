import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { User, UserRole, WorkoutStatus } from '@prisma/client';
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
};

type StoredWorkout = {
  id: string;
  clientProfileId: string;
  scheduledAt: Date;
  status: WorkoutStatus;
  templateId: string | null;
  sourceStageId: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type StoredWorkoutTemplate = {
  id: string;
  name: string;
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

describe('GET /api/clients/:id/workouts/overview (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const workouts = new Map<string, StoredWorkout>();
  const templates = new Map<string, StoredWorkoutTemplate>();

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
      findUnique: async ({ where }: { where: { login?: string; id?: string } }) => {
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
        data: { id?: string; userId: string; csrfToken: string; expiresAt: Date };
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
        if (!row || row.expiresAt.getTime() <= Date.now()) {
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
      findUnique: async ({
        where,
      }: {
        where: { id?: string; userId?: string };
      }) => {
        if (where.id !== undefined) {
          return clientProfiles.get(where.id) ?? null;
        }
        if (where.userId !== undefined) {
          return [...clientProfiles.values()].find((p) => p.userId === where.userId) ?? null;
        }
        return null;
      },
    },
    workoutTemplate: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return templates.get(where.id) ?? null;
      },
    },
    workout: {
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where: { clientProfileId: string };
        orderBy?: Array<{ scheduledAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
        include?: { template?: { select: { name: true } } };
      }) => {
        let rows = [...workouts.values()].filter(
          (w) => w.clientProfileId === where.clientProfileId,
        );
        if (orderBy?.[0]?.scheduledAt === 'asc') {
          rows = rows.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
        }
        return rows.map((row) => {
          const template =
            include?.template && row.templateId
              ? { name: templates.get(row.templateId)?.name ?? 'Template' }
              : null;
          return { ...row, template };
        });
      },
    },
  };

  beforeAll(async () => {
    const trainerHash = await argon2.hash(TRAINER_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    trainerUser = {
      id: 'user_trainer_overview',
      login: 'overview_trainer',
      phoneE164: null,
      passwordHash: trainerHash,
      role: UserRole.TRAINER,
    };
    clientUser = await createTestClientUser({
      id: 'user_client_overview',
      login: 'overview_client',
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
    await app?.close();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    sessions.clear();
    clientProfiles.clear();
    workouts.clear();
    templates.clear();

    templates.set('tpl_a', { id: 'tpl_a', name: 'Силовая A' });

    clientProfiles.set('client_own', {
      id: 'client_own',
      displayName: 'Own Client',
      userId: clientUser.id,
      deactivatedAt: null,
    });
    clientProfiles.set('client_other', {
      id: 'client_other',
      displayName: 'Other',
      userId: null,
      deactivatedAt: null,
    });
  });

  it('returns overview with BFF monthKey and workoutsThisMonth', async () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    workouts.set('wo1', {
      id: 'wo1',
      clientProfileId: 'client_own',
      scheduledAt: new Date('2026-03-10T09:00:00.000Z'),
      status: WorkoutStatus.attended,
      templateId: 'tpl_a',
      sourceStageId: null,
      createdByUserId: trainerUser.id,
      createdAt: now,
      updatedAt: now,
    });
    workouts.set('wo2', {
      id: 'wo2',
      clientProfileId: 'client_own',
      scheduledAt: new Date('2026-03-20T09:00:00.000Z'),
      status: WorkoutStatus.pending,
      templateId: 'tpl_a',
      sourceStageId: null,
      createdByUserId: trainerUser.id,
      createdAt: now,
      updatedAt: now,
    });

    vi.useRealTimers();
    const { cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_own/workouts/overview')
      .set('Cookie', cookiePairs);

    expect(res.status).toBe(200);
    expect(res.body.monthKey).toBe('2026-03');
    expect(res.body.workoutsThisMonth).toBe(2);
    expect(res.body.isEmpty).toBe(false);
    expect(res.body.nextScheduled?.id).toBe('wo2');
    expect(res.body.upcoming.length).toBeGreaterThan(0);
  });

  it('CLIENT can read own overview', async () => {
    const { cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_own/workouts/overview')
      .set('Cookie', cookiePairs);

    expect(res.status).toBe(200);
    expect(res.body.isEmpty).toBe(true);
  });

  it('CLIENT cannot read another client overview (FORBIDDEN_ROLE)', async () => {
    const { cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_other/workouts/overview')
      .set('Cookie', cookiePairs);

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
