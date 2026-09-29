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
const ADMIN_PASSWORD = 'AdminPass1!';

type StoredSession = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
};

type StoredExercise = {
  id: string;
  name: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredWorkoutTemplate = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  durationMinutes: number | null;
  microcycleWeeks: number | null;
  version: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

describe('TemplatesController (HTTP)', () => {
  let app: INestApplication;
  let adminUser: TestUserRecord;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const exercises = new Map<string, StoredExercise>();
  const templates = new Map<string, StoredWorkoutTemplate>();
  const templateExercises = new Map<string, StoredTemplateExercise>();

  const usersById = () =>
    new Map([adminUser, trainerUser, clientUser].map((u) => [u.id, u as User]));

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
    $transaction: async <T>(fn: (tx: typeof prismaMock) => Promise<T>): Promise<T> =>
      fn(prismaMock),
    get user() {
      return buildUserLookup([adminUser, trainerUser, clientUser]);
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
      findUnique: async () => null,
      findMany: async () => [],
    },
    clientLock: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    muscleGroup: {
      findMany: async () => [],
      findUnique: async () => null,
    },
    exercise: {
      findMany: async ({
        where,
      }: {
        where?: { id?: { in: string[] }; archivedAt?: null };
      }) => {
        let rows = [...exercises.values()];
        if (where?.id?.in) {
          rows = rows.filter((r) => where.id!.in.includes(r.id));
        }
        if (where?.archivedAt === null) {
          rows = rows.filter((r) => r.archivedAt === null);
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        exercises.get(where.id) ?? null,
      create: async ({ data }: { data: { name: string } }) => {
        const id = `ex_${exercises.size + 1}`;
        const now = new Date();
        const row: StoredExercise = {
          id,
          name: data.name,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        exercises.set(id, row);
        return row;
      },
    },
    exerciseMuscle: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
      findMany: async () => [],
    },
    workoutTemplate: {
      create: async ({
        data,
      }: {
        data: {
          name: string;
          type: string;
          description?: string | null;
          durationMinutes?: number | null;
          microcycleWeeks?: number | null;
          version?: number;
          exercises?: {
            create: Array<{
              exerciseId: string;
              sortOrder: number;
              plannedSets?: number | null;
              plannedReps?: number | null;
              plannedWeightKg?: number | null;
              notes?: string | null;
            }>;
          };
        };
      }) => {
        const id = `tpl_${templates.size + 1}`;
        const now = new Date();
        const row: StoredWorkoutTemplate = {
          id,
          name: data.name,
          type: data.type,
          description: data.description ?? null,
          durationMinutes: data.durationMinutes ?? null,
          microcycleWeeks: data.microcycleWeeks ?? null,
          version: data.version ?? 1,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        templates.set(id, row);
        if (data.exercises?.create) {
          for (const item of data.exercises.create) {
            const teId = `te_${templateExercises.size + 1}`;
            templateExercises.set(teId, {
              id: teId,
              templateId: id,
              exerciseId: item.exerciseId,
              sortOrder: item.sortOrder,
              plannedSets: item.plannedSets ?? null,
              plannedReps: item.plannedReps ?? null,
              plannedWeightKg:
                item.plannedWeightKg != null
                  ? { toNumber: () => item.plannedWeightKg as number }
                  : null,
              notes: item.notes ?? null,
            });
          }
        }
        return row;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { archivedAt?: null };
        orderBy?: { name: 'asc' };
      }) => {
        let rows = [...templates.values()];
        if (where?.archivedAt === null) {
          rows = rows.filter((r) => r.archivedAt === null);
        }
        if (orderBy?.name === 'asc') {
          rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        templates.get(where.id) ?? null,
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { exercises?: { orderBy: { sortOrder: 'asc' }; include: { exercise: boolean } } };
      }) => {
        const row = templates.get(where.id);
        if (!row) {
          throw new Error('template not found');
        }
        let exerciseRows = [...templateExercises.values()].filter(
          (te) => te.templateId === row.id,
        );
        exerciseRows = exerciseRows.sort((a, b) => a.sortOrder - b.sortOrder);
        if (include?.exercises) {
          return {
            ...row,
            exercises: exerciseRows.map((te) => ({
              ...te,
              exercise: exercises.get(te.exerciseId) ?? null,
            })),
          };
        }
        return { ...row, exercises: exerciseRows };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<StoredWorkoutTemplate> & { version?: { increment: number } };
      }) => {
        const row = templates.get(where.id);
        if (!row) {
          throw new Error('template not found');
        }
        const nextVersion =
          data.version?.increment !== undefined
            ? row.version + data.version.increment
            : row.version;
        const updated: StoredWorkoutTemplate = {
          ...row,
          name: data.name ?? row.name,
          type: data.type ?? row.type,
          description:
            data.description !== undefined ? data.description : row.description,
          durationMinutes:
            data.durationMinutes !== undefined
              ? data.durationMinutes
              : row.durationMinutes,
          microcycleWeeks:
            data.microcycleWeeks !== undefined
              ? data.microcycleWeeks
              : row.microcycleWeeks,
          version: nextVersion,
          updatedAt: new Date(),
        };
        templates.set(where.id, updated);
        return updated;
      },
    },
    templateExercise: {
      deleteMany: async ({ where }: { where: { templateId: string } }) => {
        for (const key of [...templateExercises.keys()]) {
          const row = templateExercises.get(key)!;
          if (row.templateId === where.templateId) {
            templateExercises.delete(key);
          }
        }
        return { count: 0 };
      },
      createMany: async ({
        data,
      }: {
        data: Array<{
          templateId: string;
          exerciseId: string;
          sortOrder: number;
          plannedSets?: number | null;
          plannedReps?: number | null;
          plannedWeightKg?: number | null;
          notes?: string | null;
        }>;
      }) => {
        for (const item of data) {
          const teId = `te_${templateExercises.size + 1}`;
          templateExercises.set(teId, {
            id: teId,
            templateId: item.templateId,
            exerciseId: item.exerciseId,
            sortOrder: item.sortOrder,
            plannedSets: item.plannedSets ?? null,
            plannedReps: item.plannedReps ?? null,
            plannedWeightKg:
              item.plannedWeightKg != null
                ? { toNumber: () => item.plannedWeightKg as number }
                : null,
            notes: item.notes ?? null,
          });
        }
        return { count: data.length };
      },
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where?: { templateId?: string | { in: string[] } };
        orderBy?: { sortOrder: 'asc' };
        include?: { exercise?: boolean };
      }) => {
        let rows = [...templateExercises.values()];
        if (where?.templateId !== undefined) {
          if (typeof where.templateId === 'string') {
            rows = rows.filter((r) => r.templateId === where.templateId);
          } else {
            rows = rows.filter((r) => where.templateId!.in.includes(r.templateId));
          }
        }
        if (orderBy?.sortOrder === 'asc') {
          rows = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
        }
        if (include?.exercise) {
          return rows.map((row) => ({
            ...row,
            exercise: exercises.get(row.exerciseId) ?? null,
          }));
        }
        return rows;
      },
    },
  };

  beforeAll(async () => {
    const trainerHash = await argon2.hash(TRAINER_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    const adminHash = await argon2.hash(ADMIN_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
    });
    trainerUser = {
      id: 'user_trainer_tpl',
      login: 'trainer_tpl',
      phoneE164: null,
      passwordHash: trainerHash,
      role: UserRole.TRAINER,
    };
    adminUser = {
      id: 'user_admin_tpl',
      login: 'admin_tpl',
      phoneE164: null,
      passwordHash: adminHash,
      role: UserRole.ADMIN,
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
    sessions.clear();
    exercises.clear();
    templates.clear();
    templateExercises.clear();
    exercises.set('ex_bench', {
      id: 'ex_bench',
      name: 'Жим лёжа',
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('creates workout template with version 1', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const res = await request(app.getHttpServer())
      .post('/api/templates')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Силовая A',
        type: 'strength',
        exercises: [{ exerciseId: 'ex_bench', sortOrder: 0, plannedSets: 3 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.version).toBe(1);
    expect(res.body.name).toBe('Силовая A');
    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].exerciseId).toBe('ex_bench');
    expect(res.body.exercises[0].plannedSets).toBe(3);
  });

  it('returns TEMPLATE_VERSION_CONFLICT on stale version patch', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/templates')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Шаблон',
        type: 'strength',
        exercises: [{ exerciseId: 'ex_bench', sortOrder: 0 }],
      });

    const templateId = createRes.body.id as string;

    const okPatch = await request(app.getHttpServer())
      .patch(`/api/templates/${templateId}`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        version: 1,
        name: 'Шаблон v2',
        type: 'strength',
        exercises: [{ exerciseId: 'ex_bench', sortOrder: 0 }],
      });

    expect(okPatch.status).toBe(200);
    expect(okPatch.body.version).toBe(2);

    const conflict = await request(app.getHttpServer())
      .patch(`/api/templates/${templateId}`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        version: 1,
        name: 'Устаревшее',
        type: 'strength',
        exercises: [{ exerciseId: 'ex_bench', sortOrder: 0 }],
      });

    expect(conflict.status).toBe(409);
    expect(conflict.body.error?.code).toBe(ErrorCode.TEMPLATE_VERSION_CONFLICT);
    expect(conflict.body.error?.details?.currentVersion).toBe(2);
  });

  it('client cannot create templates (FORBIDDEN_ROLE)', async () => {
    const client = await loginAndGetSession(app, clientUser.login, CLIENT_TEST_PASSWORD);

    const res = await request(app.getHttpServer())
      .post('/api/templates')
      .set('Cookie', client.cookiePairs)
      .set('x-csrf-token', client.csrfToken)
      .send({
        name: 'Запрещено',
        type: 'strength',
        exercises: [],
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
