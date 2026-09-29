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

type StoredMacrocycleStage = {
  id: string;
  macrocycleId: string;
  templateId: string;
  sortOrder: number;
};

type StoredClientMacroProgress = {
  id: string;
  clientProfileId: string;
  macrocycleId: string;
  currentStageId: string | null;
};

type StoredWorkoutTemplate = {
  id: string;
  name: string;
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

type StoredIdempotencyRecord = {
  id: string;
  idempotencyKey: string;
  scope: string;
  actorUserId: string;
  responseStatus: number;
  responseBody: unknown;
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

describe('WorkoutsController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const clientLocks = new Map<string, StoredClientLock>();
  const stages = new Map<string, StoredMacrocycleStage>();
  const macroProgress = new Map<string, StoredClientMacroProgress>();
  const templates = new Map<string, StoredWorkoutTemplate>();
  const workouts = new Map<string, StoredWorkout>();
  const idempotencyRecords = new Map<string, StoredIdempotencyRecord>();

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
    clientMacroProgress: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { clientProfileId: string };
        include?: { currentStage?: boolean };
      }) => {
        const row = [...macroProgress.values()].find(
          (p) => p.clientProfileId === where.clientProfileId,
        );
        if (!row) {
          return null;
        }
        if (include?.currentStage && row.currentStageId) {
          const stage = stages.get(row.currentStageId);
          return { ...row, currentStage: stage ?? null };
        }
        if (include?.currentStage) {
          return { ...row, currentStage: null };
        }
        return { ...row };
      },
    },
    macrocycleStage: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return stages.get(where.id) ?? null;
      },
    },
    workoutTemplate: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return templates.get(where.id) ?? null;
      },
    },
    workout: {
      create: async ({
        data,
      }: {
        data: {
          clientProfileId: string;
          scheduledAt: Date;
          status?: WorkoutStatus;
          templateId?: string | null;
          sourceStageId?: string | null;
          createdByUserId: string;
        };
      }) => {
        const id = `wo_${workouts.size + 1}`;
        const now = new Date();
        const row: StoredWorkout = {
          id,
          clientProfileId: data.clientProfileId,
          scheduledAt: data.scheduledAt,
          status: data.status ?? WorkoutStatus.pending,
          templateId: data.templateId ?? null,
          sourceStageId: data.sourceStageId ?? null,
          createdByUserId: data.createdByUserId,
          createdAt: now,
          updatedAt: now,
        };
        workouts.set(id, row);
        return row;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where: { clientProfileId: string };
        orderBy?: { scheduledAt: 'asc' | 'desc' } | Array<{ scheduledAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
      }) => {
        let rows = [...workouts.values()].filter(
          (w) => w.clientProfileId === where.clientProfileId,
        );
        const primaryOrder = Array.isArray(orderBy) ? orderBy[0] : orderBy;
        if (primaryOrder?.scheduledAt === 'asc') {
          rows = rows.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
        }
        return rows;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { template?: { select: { name: true } } };
      }) => {
        const row = workouts.get(where.id);
        if (!row) {
          return null;
        }
        if (include?.template && row.templateId) {
          const template = templates.get(row.templateId);
          return { ...row, template: template ? { name: template.name } : null };
        }
        if (include?.template) {
          return { ...row, template: null };
        }
        return { ...row };
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: { status?: WorkoutStatus; scheduledAt?: Date };
        include?: { template?: { select: { name: true } } };
      }) => {
        const row = workouts.get(where.id);
        if (!row) {
          throw new Error('Workout not found');
        }
        const updated: StoredWorkout = {
          ...row,
          ...data,
          updatedAt: new Date(),
        };
        workouts.set(where.id, updated);
        if (include?.template && updated.templateId) {
          const template = templates.get(updated.templateId);
          return { ...updated, template: template ? { name: template.name } : null };
        }
        if (include?.template) {
          return { ...updated, template: null };
        }
        return updated;
      },
    },
    idempotencyRecord: {
      findUnique: async ({
        where,
      }: {
        where: { scope_idempotencyKey: { scope: string; idempotencyKey: string } };
      }) => {
        const key = `${where.scope_idempotencyKey.scope}:${where.scope_idempotencyKey.idempotencyKey}`;
        return idempotencyRecords.get(key) ?? null;
      },
      create: async ({
        data,
      }: {
        data: {
          idempotencyKey: string;
          scope: string;
          actorUserId: string;
          responseStatus: number;
          responseBody: unknown;
        };
      }) => {
        const id = `idem_${idempotencyRecords.size + 1}`;
        const row: StoredIdempotencyRecord = {
          id,
          idempotencyKey: data.idempotencyKey,
          scope: data.scope,
          actorUserId: data.actorUserId,
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
          createdAt: new Date(),
        };
        idempotencyRecords.set(`${data.scope}:${data.idempotencyKey}`, row);
        return row;
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

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.GYM_TIMEZONE;
  });

  beforeEach(() => {
    sessions.clear();
    clientProfiles.clear();
    clientLocks.clear();
    stages.clear();
    macroProgress.clear();
    templates.clear();
    workouts.clear();
    idempotencyRecords.clear();

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
    templates.set('tpl_1', { id: 'tpl_1', name: 'Силовая A' });
    templates.set('tpl_manual', { id: 'tpl_manual', name: 'Ручной шаблон' });
    stages.set('stage_1', {
      id: 'stage_1',
      macrocycleId: 'macro_1',
      templateId: 'tpl_1',
      sortOrder: 0,
    });
    macroProgress.set('cmp_1', {
      id: 'cmp_1',
      clientProfileId: 'client_pool_1',
      macrocycleId: 'macro_1',
      currentStageId: 'stage_1',
    });
  });

  it('POST assign without Idempotency-Key returns VALIDATION_FAILED', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ scheduledAt: '2026-10-01T10:00:00.000Z' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('POST assign without live lock returns LOCK_REQUIRED', async () => {
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'key-no-lock')
      .send({ scheduledAt: '2026-10-01T10:00:00.000Z' });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('POST assign from current stage creates pending workout', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'assign-stage-1')
      .send({ scheduledAt: '2026-10-01T10:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.templateId).toBe('tpl_1');
    expect(res.body.sourceStageId).toBe('stage_1');
    expect(res.body.scheduledAt).toBe('2026-10-01T10:00:00.000Z');
    expect(workouts.size).toBe(1);
  });

  it('POST assign without macro progress and no templateId returns VALIDATION_FAILED', async () => {
    macroProgress.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'assign-no-macro')
      .send({ scheduledAt: '2026-10-01T10:00:00.000Z' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('POST assign with explicit templateId creates pending workout', async () => {
    macroProgress.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'assign-manual-tpl')
      .send({
        scheduledAt: '2026-10-02T12:00:00.000Z',
        templateId: 'tpl_manual',
      });

    expect(res.status).toBe(201);
    expect(res.body.templateId).toBe('tpl_manual');
    expect(res.body.sourceStageId).toBeNull();
  });

  it('POST assign replays same Idempotency-Key within 24h without duplicate workout', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const first = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'idem-replay-1')
      .send({ scheduledAt: '2026-10-03T09:00:00.000Z' });

    expect(first.status).toBe(201);
    const firstId = first.body.id as string;

    const second = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'idem-replay-1')
      .send({ scheduledAt: '2026-10-03T09:00:00.000Z' });

    expect(second.status).toBe(201);
    expect(second.body.id).toBe(firstId);
    expect(workouts.size).toBe(1);
  });

  it('GET list returns workouts for client card schedule', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'list-setup')
      .send({ scheduledAt: '2026-10-05T08:00:00.000Z' });

    const listRes = await request(app.getHttpServer())
      .get('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs);

    expect(listRes.status).toBe(200);
    expect(listRes.body.workouts).toHaveLength(1);
    expect(listRes.body.workouts[0].status).toBe('pending');
    expect(listRes.body.workouts[0].isOverdue).toBe(false);
  });

  it('GET list sets isOverdue for pending past gym-local day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T20:00:00.000Z'));
    process.env.GYM_TIMEZONE = 'Europe/Moscow';

    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    workouts.set('wo_overdue', {
      id: 'wo_overdue',
      clientProfileId: 'client_pool_1',
      scheduledAt: new Date('2026-10-01T10:00:00.000Z'),
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: 'stage_1',
      createdByUserId: trainerUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const listRes = await request(app.getHttpServer())
      .get('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs);

    expect(listRes.status).toBe(200);
    const hit = listRes.body.workouts.find((w: { id: string }) => w.id === 'wo_overdue');
    expect(hit?.isOverdue).toBe(true);
  });

  function seedPendingWorkout(id: string): void {
    const now = new Date();
    workouts.set(id, {
      id,
      clientProfileId: 'client_pool_1',
      scheduledAt: new Date('2026-10-10T09:00:00.000Z'),
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: 'stage_1',
      createdByUserId: trainerUser.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  it('POST skip does not advance macro currentStageId', async () => {
    seedPendingWorkout('wo_skip_no_advance');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_no_advance/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-no-advance');

    expect(res.status).toBe(200);
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });

  it('POST cancel does not advance macro currentStageId', async () => {
    seedPendingWorkout('wo_cancel_no_advance');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_cancel_no_advance/cancel')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'cancel-no-advance');

    expect(res.status).toBe(200);
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });

  it('POST skip pending workout returns skipped status', async () => {
    seedPendingWorkout('wo_skip_1');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_1/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('skipped');
    expect(workouts.get('wo_skip_1')?.status).toBe(WorkoutStatus.skipped);
  });

  it('POST cancel pending workout returns cancelled status', async () => {
    seedPendingWorkout('wo_cancel_1');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_cancel_1/cancel')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'cancel-1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('POST skip without lock returns LOCK_REQUIRED', async () => {
    seedPendingWorkout('wo_skip_no_lock');
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_no_lock/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-no-lock');

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('POST skip non-pending returns WORKOUT_STATUS_CONFLICT', async () => {
    seedPendingWorkout('wo_skip_conflict');
    workouts.get('wo_skip_conflict')!.status = WorkoutStatus.attended;
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_conflict/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-conflict');

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.WORKOUT_STATUS_CONFLICT);
  });

  it('POST skip replays Idempotency-Key without double transition', async () => {
    seedPendingWorkout('wo_skip_idem');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const first = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_idem/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-idem-replay');

    expect(first.status).toBe(200);

    workouts.get('wo_skip_idem')!.status = WorkoutStatus.pending;

    const second = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_idem/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'skip-idem-replay');

    expect(second.status).toBe(200);
    expect(second.body.status).toBe('skipped');
    expect(workouts.get('wo_skip_idem')?.status).toBe(WorkoutStatus.pending);
  });

  it('client role cannot skip (FORBIDDEN_ROLE)', async () => {
    seedPendingWorkout('wo_skip_client');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/workouts/wo_skip_client/skip')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'client-skip');

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('PATCH reschedule pending workout updates scheduledAt and keeps pending', async () => {
    seedPendingWorkout('wo_reschedule_1');
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .patch('/api/workouts/wo_reschedule_1')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ scheduledAt: '2026-11-01T14:30:00.000Z' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.scheduledAt).toBe('2026-11-01T14:30:00.000Z');
    expect(workouts.get('wo_reschedule_1')?.status).toBe(WorkoutStatus.pending);
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });

  it('PATCH reschedule without lock returns LOCK_REQUIRED', async () => {
    seedPendingWorkout('wo_reschedule_no_lock');
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .patch('/api/workouts/wo_reschedule_no_lock')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ scheduledAt: '2026-11-02T10:00:00.000Z' });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('PATCH reschedule non-pending returns WORKOUT_STATUS_CONFLICT', async () => {
    seedPendingWorkout('wo_reschedule_conflict');
    workouts.get('wo_reschedule_conflict')!.status = WorkoutStatus.skipped;
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .patch('/api/workouts/wo_reschedule_conflict')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ scheduledAt: '2026-11-03T10:00:00.000Z' });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.WORKOUT_STATUS_CONFLICT);
  });

  it('client role cannot assign (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .post('/api/clients/client_pool_1/workouts')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .set('Idempotency-Key', 'client-forbidden')
      .send({ scheduledAt: '2026-10-01T10:00:00.000Z' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
