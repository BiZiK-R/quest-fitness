import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExerciseMuscleRole, User, UserRole } from '@prisma/client';
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

type StoredMuscleGroup = {
  id: string;
  name: string;
  sortOrder: number | null;
  createdAt: Date;
};

type StoredExercise = {
  id: string;
  name: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredExerciseMuscle = {
  exerciseId: string;
  muscleGroupId: string;
  role: ExerciseMuscleRole;
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

describe('ExercisesController (HTTP)', () => {
  let app: INestApplication;
  let adminUser: TestUserRecord;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const muscleGroups = new Map<string, StoredMuscleGroup>();
  const exercises = new Map<string, StoredExercise>();
  const exerciseMuscles = new Map<string, StoredExerciseMuscle>();

  const muscleKey = (exerciseId: string, muscleGroupId: string) =>
    `${exerciseId}:${muscleGroupId}`;

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
      findMany: async ({
        where,
        orderBy,
        select,
      }: {
        where?: { id?: { in: string[] } };
        orderBy?: Array<{ sortOrder: 'asc' } | { name: 'asc' }>;
        select?: { id?: boolean };
      }) => {
        let rows = [...muscleGroups.values()];
        if (where?.id?.in) {
          rows = rows.filter((r) => where.id!.in.includes(r.id));
        }
        if (orderBy) {
          rows.sort((a, b) => {
            const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
            const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
            if (aSort !== bSort) {
              return aSort - bSort;
            }
            return a.name.localeCompare(b.name);
          });
        }
        if (select?.id) {
          return rows.map((r) => ({ id: r.id }));
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        muscleGroups.get(where.id) ?? null,
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { name: string };
        create: { name: string; sortOrder?: number | null };
        update: { sortOrder?: number | null };
      }) => {
        const existing = [...muscleGroups.values()].find((g) => g.name === where.name);
        if (existing) {
          const updated = {
            ...existing,
            sortOrder: update.sortOrder ?? existing.sortOrder,
          };
          muscleGroups.set(existing.id, updated);
          return updated;
        }
        const id = `mg_${muscleGroups.size + 1}`;
        const row: StoredMuscleGroup = {
          id,
          name: create.name,
          sortOrder: create.sortOrder ?? null,
          createdAt: new Date(),
        };
        muscleGroups.set(id, row);
        return row;
      },
    },
    exercise: {
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
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where?: { archivedAt?: null | { not: null } };
        orderBy?: { name: 'asc' };
        include?: { muscles?: boolean };
      }) => {
        let rows = [...exercises.values()];
        if (where?.archivedAt === null) {
          rows = rows.filter((e) => e.archivedAt === null);
        }
        if (orderBy?.name === 'asc') {
          rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        }
        if (include?.muscles) {
          return rows.map((row) => ({
            ...row,
            muscles: [...exerciseMuscles.values()].filter(
              (m) => m.exerciseId === row.id,
            ),
          }));
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        exercises.get(where.id) ?? null,
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { muscles?: boolean };
      }) => {
        const row = exercises.get(where.id);
        if (!row) {
          throw new Error('exercise not found');
        }
        const muscles = include?.muscles
          ? [...exerciseMuscles.values()].filter((m) => m.exerciseId === row.id)
          : [];
        return { ...row, muscles };
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: { name?: string; archivedAt?: Date | null; updatedAt?: Date };
        include?: { muscles?: boolean };
      }) => {
        const row = exercises.get(where.id);
        if (!row) {
          throw new Error('exercise not found');
        }
        const updated = {
          ...row,
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.archivedAt !== undefined ? { archivedAt: data.archivedAt } : {}),
          updatedAt: data.updatedAt ?? new Date(),
        };
        exercises.set(where.id, updated);
        if (include?.muscles) {
          return {
            ...updated,
            muscles: [...exerciseMuscles.values()].filter(
              (m) => m.exerciseId === updated.id,
            ),
          };
        }
        return updated;
      },
    },
    exerciseMuscle: {
      deleteMany: async ({ where }: { where: { exerciseId: string } }) => {
        for (const key of [...exerciseMuscles.keys()]) {
          const row = exerciseMuscles.get(key)!;
          if (row.exerciseId === where.exerciseId) {
            exerciseMuscles.delete(key);
          }
        }
        return { count: 0 };
      },
      createMany: async ({
        data,
      }: {
        data: Array<{
          exerciseId: string;
          muscleGroupId: string;
          role: ExerciseMuscleRole;
        }>;
      }) => {
        for (const item of data) {
          exerciseMuscles.set(muscleKey(item.exerciseId, item.muscleGroupId), item);
        }
        return { count: data.length };
      },
      findMany: async ({
        where,
      }: {
        where?: { exerciseId?: { in: string[] } | string };
      }) => {
        let rows = [...exerciseMuscles.values()];
        if (where?.exerciseId !== undefined) {
          if (typeof where.exerciseId === 'string') {
            rows = rows.filter((r) => r.exerciseId === where.exerciseId);
          } else {
            rows = rows.filter((r) => where.exerciseId!.in.includes(r.exerciseId));
          }
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
      id: 'user_trainer_1',
      login: 'traineruser',
      phoneE164: null,
      passwordHash: trainerHash,
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
    muscleGroups.clear();
    exercises.clear();
    exerciseMuscles.clear();
    muscleGroups.set('mg_chest', {
      id: 'mg_chest',
      name: 'Грудь',
      sortOrder: 1,
      createdAt: new Date(),
    });
    muscleGroups.set('mg_back', {
      id: 'mg_back',
      name: 'Спина',
      sortOrder: 2,
      createdAt: new Date(),
    });
  });

  it('lists muscle groups for trainer', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const res = await request(app.getHttpServer())
      .get('/api/muscle-groups')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.muscleGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'mg_chest', name: 'Грудь' }),
        expect.objectContaining({ id: 'mg_back', name: 'Спина' }),
      ]),
    );
  });

  it('creates exercise without groups and sets missingMuscleGroupsWarning', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ name: 'Планка' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Планка');
    expect(createRes.body.missingMuscleGroupsWarning).toBe(true);
    expect(createRes.body.primaryMuscleGroupId).toBeNull();
    expect(createRes.body.secondaryMuscleGroupIds).toEqual([]);
  });

  it('creates exercise with primary and secondary groups', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Жим лёжа',
        primaryMuscleGroupId: 'mg_chest',
        secondaryMuscleGroupIds: ['mg_back'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.missingMuscleGroupsWarning).toBe(false);
    expect(createRes.body.primaryMuscleGroupId).toBe('mg_chest');
    expect(createRes.body.secondaryMuscleGroupIds).toEqual(['mg_back']);
  });

  it('lists exercises excluding archived by default', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const active = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ name: 'Активное' });

    const archived = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ name: 'Архивное' });

    await request(app.getHttpServer())
      .post(`/api/exercises/${archived.body.id as string}/archive`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({});

    const listRes = await request(app.getHttpServer())
      .get('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken);

    expect(listRes.status).toBe(200);
    const ids = (listRes.body.exercises as Array<{ id: string }>).map((e) => e.id);
    expect(ids).toContain(active.body.id);
    expect(ids).not.toContain(archived.body.id);
  });

  it('lists archived exercises when includeArchived=true', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const archived = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ name: 'Старое' });

    await request(app.getHttpServer())
      .post(`/api/exercises/${archived.body.id as string}/archive`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({});

    const listRes = await request(app.getHttpServer())
      .get('/api/exercises?includeArchived=true')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken);

    expect(listRes.status).toBe(200);
    const hit = (listRes.body.exercises as Array<{ id: string; archivedAt: string | null }>).find(
      (e) => e.id === archived.body.id,
    );
    expect(hit?.archivedAt).toBeTruthy();
  });

  it('patches exercise name and muscle groups', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ name: 'Старое имя' });

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/exercises/${createRes.body.id as string}`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Новое имя',
        primaryMuscleGroupId: 'mg_chest',
        secondaryMuscleGroupIds: [],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.name).toBe('Новое имя');
    expect(patchRes.body.primaryMuscleGroupId).toBe('mg_chest');
    expect(patchRes.body.missingMuscleGroupsWarning).toBe(false);
  });

  it('client cannot create exercises (FORBIDDEN_ROLE)', async () => {
    const client = await loginAndGetSession(app, clientUser.login, CLIENT_TEST_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/exercises')
      .set('Cookie', client.cookiePairs)
      .set('x-csrf-token', client.csrfToken)
      .send({ name: 'Запрещено' });

    expect(createRes.status).toBe(403);
    expect(createRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('rejects unauthenticated exercise list', async () => {
    const res = await request(app.getHttpServer()).get('/api/exercises');
    expect(res.status).toBe(401);
  });
});
