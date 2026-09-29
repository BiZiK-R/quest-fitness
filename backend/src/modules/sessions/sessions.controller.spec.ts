import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStatus, User, UserRole, WorkoutStatus } from '@prisma/client';
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

type StoredClientLock = {
  clientId: string;
  holderTrainerId: string;
  lastActivityAt: Date;
  activeSessionId: string | null;
  createdAt: Date;
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
  durationMinutes: number | null;
};

type StoredTemplateExercise = {
  id: string;
  templateId: string;
  exerciseId: string;
  sortOrder: number;
  plannedSets: number | null;
  plannedReps: number | null;
  plannedWeightKg: { toNumber: () => number } | null;
  notes: string | null;
};

type StoredExercise = {
  id: string;
  name: string;
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
  createdAt: Date;
  updatedAt: Date;
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

describe('SessionsController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const authSessions = new Map<string, StoredSession>();
  const clientLocks = new Map<string, StoredClientLock>();
  const workouts = new Map<string, StoredWorkout>();
  const templates = new Map<string, StoredWorkoutTemplate>();
  const templateExercises = new Map<string, StoredTemplateExercise>();
  const exercises = new Map<string, StoredExercise>();
  const trainingSessions = new Map<string, StoredTrainingSession>();
  const sessionExercises = new Map<string, StoredSessionExercise>();

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
    $transaction: async <T>(fn: (tx: typeof prismaMock) => Promise<T>): Promise<T> => fn(prismaMock),
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
    clientProfile: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === 'client_pool_1') {
          return { id: 'client_pool_1', displayName: 'Клиент', deactivatedAt: null };
        }
        return null;
      },
    },
    clientLock: {
      findUnique: async ({ where }: { where: { clientId: string } }) => {
        return clientLocks.get(where.clientId) ?? null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { clientId: string };
        data: { activeSessionId?: string | null; lastActivityAt?: Date };
      }) => {
        const row = clientLocks.get(where.clientId);
        if (!row) {
          throw new Error('Lock not found');
        }
        const updated = { ...row, ...data };
        clientLocks.set(where.clientId, updated);
        return updated;
      },
    },
    workout: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return workouts.get(where.id) ?? null;
      },
    },
    workoutTemplate: {
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select?: { durationMinutes?: boolean };
      }) => {
        const row = templates.get(where.id);
        if (!row) {
          return null;
        }
        if (select?.durationMinutes) {
          return { durationMinutes: row.durationMinutes };
        }
        return row;
      },
    },
    templateExercise: {
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where: { templateId: string };
        orderBy?: { sortOrder: 'asc' };
        include?: { exercise: { select: { name: true } } };
      }) => {
        let rows = [...templateExercises.values()].filter((te) => te.templateId === where.templateId);
        if (orderBy?.sortOrder === 'asc') {
          rows = rows.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        if (include?.exercise) {
          return rows.map((te) => ({
            ...te,
            exercise: exercises.get(te.exerciseId) ?? { name: 'Unknown' },
          }));
        }
        return rows;
      },
    },
    session: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string; workoutId?: string };
        include?: { exercises?: boolean };
      }) => {
        let row: StoredTrainingSession | undefined;
        if (where.id) {
          row = trainingSessions.get(where.id);
        } else if (where.workoutId) {
          row = [...trainingSessions.values()].find((s) => s.workoutId === where.workoutId);
        }
        if (!row) {
          return null;
        }
        if (include?.exercises) {
          const exRows = [...sessionExercises.values()]
            .filter((e) => e.sessionId === row!.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...row, exercises: exRows };
        }
        return { ...row };
      },
      create: async ({
        data,
      }: {
        data: {
          workoutId: string;
          clientProfileId: string;
          authorTrainerId: string;
          status: SessionStatus;
          startedAt: Date;
          plannedDurationMinutes: number;
        };
      }) => {
        const id = `sess_${trainingSessions.size + 1}`;
        const now = new Date();
        const row: StoredTrainingSession = {
          id,
          workoutId: data.workoutId,
          clientProfileId: data.clientProfileId,
          authorTrainerId: data.authorTrainerId,
          status: data.status,
          startedAt: data.startedAt,
          completedAt: null,
          abandonedAt: null,
          plannedDurationMinutes: data.plannedDurationMinutes,
          createdAt: now,
          updatedAt: now,
        };
        trainingSessions.set(id, row);
        return row;
      },
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { exercises?: boolean };
      }) => {
        const row = await prismaMock.session.findUnique({ where, include });
        if (!row) {
          throw new Error('Session not found');
        }
        return row;
      },
    },
    sessionExercise: {
      createMany: async ({
        data,
      }: {
        data: Array<{
          sessionId: string;
          exerciseId: string;
          sortOrder: number;
          plannedSets: number | null;
          plannedReps: number | null;
          plannedWeightKg: unknown;
          nameSnapshot: string;
          notes: string | null;
        }>;
      }) => {
        for (const item of data) {
          const id = `se_${sessionExercises.size + 1}`;
          sessionExercises.set(id, {
            id,
            sessionId: item.sessionId,
            exerciseId: item.exerciseId,
            sortOrder: item.sortOrder,
            plannedSets: item.plannedSets,
            plannedReps: item.plannedReps,
            plannedWeightKg:
              item.plannedWeightKg != null
                ? { toNumber: () => Number(item.plannedWeightKg) }
                : null,
            nameSnapshot: item.nameSnapshot,
            notes: item.notes,
          });
        }
        return { count: data.length };
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
    clientLocks.clear();
    workouts.clear();
    templates.clear();
    templateExercises.clear();
    exercises.clear();
    trainingSessions.clear();
    sessionExercises.clear();

    const now = new Date();
    clientLocks.set('client_pool_1', {
      clientId: 'client_pool_1',
      holderTrainerId: trainerUser.id,
      lastActivityAt: now,
      activeSessionId: null,
      createdAt: now,
    });

    templates.set('tpl_1', { id: 'tpl_1', durationMinutes: 45 });
    exercises.set('ex_1', { id: 'ex_1', name: 'Жим лёжа' });
    exercises.set('ex_2', { id: 'ex_2', name: 'Присед' });
    templateExercises.set('te_1', {
      id: 'te_1',
      templateId: 'tpl_1',
      exerciseId: 'ex_1',
      sortOrder: 0,
      plannedSets: 3,
      plannedReps: 10,
      plannedWeightKg: { toNumber: () => 60 },
      notes: null,
    });
    templateExercises.set('te_2', {
      id: 'te_2',
      templateId: 'tpl_1',
      exerciseId: 'ex_2',
      sortOrder: 1,
      plannedSets: 4,
      plannedReps: 8,
      plannedWeightKg: null,
      notes: 'глубоко',
    });

    workouts.set('wo_pending_1', {
      id: 'wo_pending_1',
      clientProfileId: 'client_pool_1',
      scheduledAt: new Date('2026-10-01T10:00:00.000Z'),
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: null,
      createdByUserId: trainerUser.id,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('POST start without lock returns LOCK_REQUIRED', async () => {
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('POST start creates active session, snapshot, and sets activeSessionId on lock', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
    expect(res.body.workoutId).toBe('wo_pending_1');
    expect(res.body.plannedDurationMinutes).toBe(45);
    expect(res.body.startedAt).toBeTruthy();
    expect(res.body.exercises).toHaveLength(2);
    expect(res.body.exercises[0].nameSnapshot).toBe('Жим лёжа');
    expect(res.body.exercises[0].plannedSets).toBe(3);
    expect(res.body.exercises[1].nameSnapshot).toBe('Присед');

    const lock = clientLocks.get('client_pool_1');
    expect(lock?.activeSessionId).toBe(res.body.id);
  });

  it('POST start when session already active returns SESSION_ALREADY_ACTIVE', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const first = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(second.status).toBe(409);
    expect(second.body.error?.code).toBe(ErrorCode.SESSION_ALREADY_ACTIVE);
  });

  it('GET session returns snapshot unchanged after template exercise rename', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const startRes = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);
    expect(startRes.status).toBe(201);
    const sessionId = startRes.body.id as string;

    exercises.set('ex_1', { id: 'ex_1', name: 'Жим переименованный' });

    const getRes = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(getRes.status).toBe(200);
    expect(getRes.body.exercises[0].nameSnapshot).toBe('Жим лёжа');
  });

  it('GET session as CLIENT returns FORBIDDEN_ROLE', async () => {
    const { csrfToken: trainerCsrf, cookiePairs: trainerCookies } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const startRes = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', trainerCookies)
      .set('x-csrf-token', trainerCsrf);
    const sessionId = startRes.body.id as string;

    const { csrfToken: clientCsrf, cookiePairs: clientCookies } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const getRes = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .set('Cookie', clientCookies)
      .set('x-csrf-token', clientCsrf);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('POST start without templateId returns VALIDATION_FAILED', async () => {
    const wo = workouts.get('wo_pending_1')!;
    workouts.set('wo_pending_1', { ...wo, templateId: null });

    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_pending_1/session')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });
});
