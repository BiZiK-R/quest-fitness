import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SessionStatus, User, UserRole } from '@prisma/client';
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

type StoredTrainingSession = {
  id: string;
  workoutId: string;
  clientProfileId: string;
  authorTrainerId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  abandonedAt: Date | null;
  plannedDurationMinutes: number | null;
};

type StoredSessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  sortOrder: number;
  plannedSets: number | null;
  plannedReps: number | null;
  plannedWeightKg: { toNumber: () => number } | null;
  nameSnapshot: string;
  notes: string | null;
  supersetGroupId: string | null;
};

type StoredLoggedSet = {
  id: string;
  sessionId: string;
  sessionExerciseId: string;
  sequenceIndex: number;
  weightKg: { toNumber: () => number } | null;
  reps: number | null;
  rpe: { toNumber: () => number } | null;
  modifierId: string | null;
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

describe('DiaryController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const authSessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const trainingSessions = new Map<string, StoredTrainingSession>();
  const sessionExercises = new Map<string, StoredSessionExercise>();
  const loggedSets = new Map<string, StoredLoggedSet>();
  const setModifiers = new Map<string, { id: string; name: string; colorToken: string }>();

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
        data: { id?: string; userId: string; csrfToken: string; expiresAt: Date };
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
    session: {
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where: {
          clientProfileId?: string;
          status?: { in: SessionStatus[] };
        };
        orderBy?: { startedAt: 'desc' };
        include?: {
          sets?: boolean;
          authorTrainer?: { select: { login: boolean } };
        };
      }) => {
        let rows = [...trainingSessions.values()].filter((s) => {
          if (where.clientProfileId && s.clientProfileId !== where.clientProfileId) {
            return false;
          }
          if (where.status?.in && !where.status.in.includes(s.status)) {
            return false;
          }
          return true;
        });
        if (orderBy?.startedAt === 'desc') {
          rows = rows.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        }
        return rows.map((s) => {
          const authorTrainer = include?.authorTrainer
            ? { login: usersById().get(s.authorTrainerId)?.login ?? 'trainer' }
            : undefined;
          const sets = include?.sets
            ? [...loggedSets.values()].filter((set) => set.sessionId === s.id)
            : undefined;
          return { ...s, authorTrainer, sets };
        });
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: {
          exercises?: boolean;
          sets?: { orderBy?: { sequenceIndex: 'asc' }; include?: { modifier: boolean } };
          authorTrainer?: { select: { login: boolean } };
        };
      }) => {
        const row = trainingSessions.get(where.id);
        if (!row) {
          return null;
        }
        const exercises = include?.exercises
          ? [...sessionExercises.values()]
              .filter((e) => e.sessionId === row.id)
              .sort((a, b) => a.sortOrder - b.sortOrder)
          : undefined;
        let sets = include?.sets
          ? [...loggedSets.values()]
              .filter((set) => set.sessionId === row.id)
              .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
          : undefined;
        if (sets && include?.sets?.include?.modifier) {
          sets = sets.map((set) => ({
            ...set,
            modifier: set.modifierId ? setModifiers.get(set.modifierId) ?? null : null,
          }));
        }
        const authorTrainer = include?.authorTrainer
          ? { login: usersById().get(row.authorTrainerId)?.login ?? 'trainer' }
          : undefined;
        return { ...row, exercises, sets, authorTrainer };
      },
    },
  };

  beforeAll(async () => {
    trainerUser = {
      id: 'user_trainer_diary',
      login: 'diarytrainer',
      phoneE164: null,
      passwordHash: await argon2.hash(TRAINER_PASSWORD, { type: argon2.argon2id, memoryCost: 65536 }),
      role: UserRole.TRAINER,
    };
    clientUser = await createTestClientUser({
      id: 'user_client_diary',
      login: 'diaryclient',
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
    authSessions.clear();
    clientProfiles.clear();
    trainingSessions.clear();
    sessionExercises.clear();
    loggedSets.clear();
    setModifiers.clear();

    clientProfiles.set('client_own', {
      id: 'client_own',
      displayName: 'Свой клиент',
      userId: clientUser.id,
      deactivatedAt: null,
    });
    clientProfiles.set('client_other', {
      id: 'client_other',
      displayName: 'Чужой клиент',
      userId: null,
      deactivatedAt: null,
    });

    trainingSessions.set('sess_completed_old', {
      id: 'sess_completed_old',
      workoutId: 'wo_1',
      clientProfileId: 'client_own',
      authorTrainerId: trainerUser.id,
      status: SessionStatus.completed,
      startedAt: new Date('2026-09-01T10:00:00.000Z'),
      completedAt: new Date('2026-09-01T11:00:00.000Z'),
      abandonedAt: null,
      plannedDurationMinutes: 60,
    });
    trainingSessions.set('sess_abandoned_new', {
      id: 'sess_abandoned_new',
      workoutId: 'wo_2',
      clientProfileId: 'client_own',
      authorTrainerId: trainerUser.id,
      status: SessionStatus.abandoned,
      startedAt: new Date('2026-09-10T10:00:00.000Z'),
      completedAt: null,
      abandonedAt: new Date('2026-09-10T10:30:00.000Z'),
      plannedDurationMinutes: 60,
    });
    trainingSessions.set('sess_active', {
      id: 'sess_active',
      workoutId: 'wo_3',
      clientProfileId: 'client_own',
      authorTrainerId: trainerUser.id,
      status: SessionStatus.active,
      startedAt: new Date('2026-09-15T10:00:00.000Z'),
      completedAt: null,
      abandonedAt: null,
      plannedDurationMinutes: 60,
    });

    const setTimestamps = {
      createdAt: new Date('2026-09-10T10:05:00.000Z'),
      updatedAt: new Date('2026-09-10T10:05:00.000Z'),
    };

    loggedSets.set('set_1', {
      id: 'set_1',
      sessionId: 'sess_completed_old',
      sessionExerciseId: 'se_1',
      sequenceIndex: 0,
      weightKg: { toNumber: () => 100 },
      reps: 5,
      rpe: null,
      modifierId: null,
      ...setTimestamps,
    });
    loggedSets.set('set_2', {
      id: 'set_2',
      sessionId: 'sess_abandoned_new',
      sessionExerciseId: 'se_2',
      sequenceIndex: 0,
      weightKg: { toNumber: () => 50 },
      reps: 10,
      rpe: { toNumber: () => 8 },
      modifierId: 'mod_1',
      ...setTimestamps,
    });

    sessionExercises.set('se_2', {
      id: 'se_2',
      sessionId: 'sess_abandoned_new',
      exerciseId: 'ex_1',
      sortOrder: 0,
      plannedSets: 3,
      plannedReps: 10,
      plannedWeightKg: null,
      nameSnapshot: 'Присед',
      notes: null,
      supersetGroupId: null,
    });

    setModifiers.set('mod_1', { id: 'mod_1', name: 'Дроп', colorToken: 'red' });
  });

  it('GET client diary lists completed and abandoned newest first, excludes active', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_own/diary')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0].sessionId).toBe('sess_abandoned_new');
    expect(res.body.entries[0].incomplete).toBe(true);
    expect(res.body.entries[1].sessionId).toBe('sess_completed_old');
    expect(res.body.entries[1].incomplete).toBe(false);
    expect(res.body.entries[0].setCount).toBe(1);
    expect(res.body.entries[0].totalTonnageKg).toBe(500);
    expect(res.body.entries[0].authorDisplayName).toBe(trainerUser.login);
  });

  it('GET session detail returns abandoned session with sets and modifiers', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/diary/sessions/sess_abandoned_new')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.incomplete).toBe(true);
    expect(res.body.status).toBe('abandoned');
    expect(res.body.totalTonnageKg).toBe(500);
    expect(res.body.sets[0].modifier.name).toBe('Дроп');
  });

  it('CLIENT can read own client diary', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_own/diary')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.entries.length).toBeGreaterThan(0);
  });

  it('CLIENT cannot read another client diary (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/clients/client_other/diary')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('CLIENT cannot read another client session detail (FORBIDDEN_ROLE)', async () => {
    trainingSessions.set('sess_other_client', {
      id: 'sess_other_client',
      workoutId: 'wo_9',
      clientProfileId: 'client_other',
      authorTrainerId: trainerUser.id,
      status: SessionStatus.completed,
      startedAt: new Date('2026-09-05T10:00:00.000Z'),
      completedAt: new Date('2026-09-05T11:00:00.000Z'),
      abandonedAt: null,
      plannedDurationMinutes: 60,
    });

    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .get('/api/diary/sessions/sess_other_client')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
