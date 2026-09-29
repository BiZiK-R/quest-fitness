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

type StoredWorkoutTemplate = {
  id: string;
  name: string;
  archivedAt: Date | null;
};

type StoredMacrocycle = {
  id: string;
  name: string;
  periodicityNote: string | null;
  createdAt: Date;
  updatedAt: Date;
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

describe('MacrocyclesController (HTTP)', () => {
  let app: INestApplication;
  let adminUser: TestUserRecord;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const templates = new Map<string, StoredWorkoutTemplate>();
  const macrocycles = new Map<string, StoredMacrocycle>();
  const stages = new Map<string, StoredMacrocycleStage>();
  const macroProgress = new Map<string, StoredClientMacroProgress>();

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
      findMany: async () => [],
      findUnique: async () => null,
    },
    exerciseMuscle: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
      findMany: async () => [],
    },
    workoutTemplate: {
      findMany: async ({
        where,
      }: {
        where?: { id?: { in: string[] }; archivedAt?: null };
      }) => {
        let rows = [...templates.values()];
        if (where?.id?.in) {
          rows = rows.filter((r) => where.id!.in.includes(r.id));
        }
        if (where?.archivedAt === null) {
          rows = rows.filter((r) => r.archivedAt === null);
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        templates.get(where.id) ?? null,
    },
    templateExercise: {
      findMany: async () => [],
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
    },
    macrocycle: {
      create: async ({
        data,
      }: {
        data: {
          name: string;
          periodicityNote?: string | null;
          stages?: {
            create: Array<{ templateId: string; sortOrder: number }>;
          };
        };
      }) => {
        const id = `macro_${macrocycles.size + 1}`;
        const now = new Date();
        const row: StoredMacrocycle = {
          id,
          name: data.name,
          periodicityNote: data.periodicityNote ?? null,
          createdAt: now,
          updatedAt: now,
        };
        macrocycles.set(id, row);
        if (data.stages?.create) {
          for (const item of data.stages.create) {
            const stageId = `stage_${stages.size + 1}`;
            stages.set(stageId, {
              id: stageId,
              macrocycleId: id,
              templateId: item.templateId,
              sortOrder: item.sortOrder,
            });
          }
        }
        return row;
      },
      findMany: async ({ orderBy }: { orderBy?: { name: 'asc' } }) => {
        let rows = [...macrocycles.values()];
        if (orderBy?.name === 'asc') {
          rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        }
        return rows;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        macrocycles.get(where.id) ?? null,
      findUniqueOrThrow: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: {
          stages?: {
            orderBy: { sortOrder: 'asc' };
            include?: { template: { select: { name: true } } };
          };
        };
      }) => {
        const row = macrocycles.get(where.id);
        if (!row) {
          throw new Error('macrocycle not found');
        }
        let stageRows = [...stages.values()].filter((s) => s.macrocycleId === row.id);
        stageRows = stageRows.sort((a, b) => a.sortOrder - b.sortOrder);
        if (include?.stages) {
          return {
            ...row,
            stages: stageRows.map((s) => ({
              ...s,
              template: templates.get(s.templateId) ?? { name: '?' },
            })),
          };
        }
        return { ...row, stages: stageRows };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Pick<StoredMacrocycle, 'name' | 'periodicityNote'>>;
      }) => {
        const row = macrocycles.get(where.id);
        if (!row) {
          throw new Error('macrocycle not found');
        }
        const updated = {
          ...row,
          name: data.name ?? row.name,
          periodicityNote:
            data.periodicityNote !== undefined
              ? data.periodicityNote
              : row.periodicityNote,
          updatedAt: new Date(),
        };
        macrocycles.set(where.id, updated);
        return updated;
      },
    },
    macrocycleStage: {
      findMany: async ({ where }: { where?: { macrocycleId?: string } }) => {
        let rows = [...stages.values()];
        if (where?.macrocycleId) {
          rows = rows.filter((r) => r.macrocycleId === where.macrocycleId);
        }
        return rows;
      },
      create: async ({
        data,
      }: {
        data: { macrocycleId: string; templateId: string; sortOrder: number };
      }) => {
        const id = `stage_${stages.size + 1}`;
        const row: StoredMacrocycleStage = {
          id,
          macrocycleId: data.macrocycleId,
          templateId: data.templateId,
          sortOrder: data.sortOrder,
        };
        stages.set(id, row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Pick<StoredMacrocycleStage, 'templateId' | 'sortOrder'>>;
      }) => {
        const row = stages.get(where.id);
        if (!row) {
          throw new Error('stage not found');
        }
        const updated = { ...row, ...data };
        stages.set(where.id, updated);
        return updated;
      },
      deleteMany: async ({ where }: { where: { id?: { in: string[] } } }) => {
        if (where.id?.in) {
          for (const id of where.id.in) {
            stages.delete(id);
          }
        }
        return { count: where.id?.in.length ?? 0 };
      },
    },
    clientMacroProgress: {
      findMany: async ({
        where,
      }: {
        where?: { macrocycleId?: string; currentStageId?: { in: string[] } };
      }) => {
        let rows = [...macroProgress.values()];
        if (where?.macrocycleId) {
          rows = rows.filter((r) => r.macrocycleId === where.macrocycleId);
        }
        if (where?.currentStageId?.in) {
          rows = rows.filter(
            (r) =>
              r.currentStageId !== null &&
              where.currentStageId!.in.includes(r.currentStageId),
          );
        }
        return rows;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { macrocycleId?: string; currentStageId?: { in: string[] } };
        data: { currentStageId: string | null };
      }) => {
        let count = 0;
        for (const [key, row] of macroProgress) {
          if (where.macrocycleId && row.macrocycleId !== where.macrocycleId) {
            continue;
          }
          if (where.currentStageId?.in) {
            if (
              row.currentStageId === null ||
              !where.currentStageId.in.includes(row.currentStageId)
            ) {
              continue;
            }
          }
          macroProgress.set(key, { ...row, currentStageId: data.currentStageId });
          count += 1;
        }
        return { count };
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
      id: 'user_trainer_macro',
      login: 'trainer_macro',
      phoneE164: null,
      passwordHash: trainerHash,
      role: UserRole.TRAINER,
    };
    adminUser = {
      id: 'user_admin_macro',
      login: 'admin_macro',
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
    templates.clear();
    macrocycles.clear();
    stages.clear();
    macroProgress.clear();
    templates.set('tpl_a', {
      id: 'tpl_a',
      name: 'Шаблон A',
      archivedAt: null,
    });
    templates.set('tpl_b', {
      id: 'tpl_b',
      name: 'Шаблон B',
      archivedAt: null,
    });
  });

  it('creates macrocycle with ordered stages', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const res = await request(app.getHttpServer())
      .post('/api/macrocycles')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Силовой макро',
        periodicityNote: '4 недели на этап',
        stages: [
          { templateId: 'tpl_a', sortOrder: 0 },
          { templateId: 'tpl_b', sortOrder: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Силовой макро');
    expect(res.body.stages).toHaveLength(2);
    expect(res.body.stages[0].templateId).toBe('tpl_a');
    expect(res.body.stages[0].sortOrder).toBe(0);
    expect(res.body.stages[1].templateId).toBe('tpl_b');
    expect(res.body.stages[1].sortOrder).toBe(1);
  });

  it('nulls client progress when removed stage is deleted via PATCH', async () => {
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/macrocycles')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Макро',
        stages: [
          { templateId: 'tpl_a', sortOrder: 0 },
          { templateId: 'tpl_b', sortOrder: 1 },
        ],
      });

    const macroId = createRes.body.id as string;
    const stageToKeep = createRes.body.stages[0] as { id: string; templateId: string };
    const stageToRemove = createRes.body.stages[1] as { id: string };

    macroProgress.set('prog_1', {
      id: 'prog_1',
      clientProfileId: 'client_prof_1',
      macrocycleId: macroId,
      currentStageId: stageToRemove.id,
    });

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/macrocycles/${macroId}`)
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({
        name: 'Макро',
        stages: [
          {
            id: stageToKeep.id,
            templateId: stageToKeep.templateId,
            sortOrder: 0,
          },
        ],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.stages).toHaveLength(1);
    expect(macroProgress.get('prog_1')?.currentStageId).toBeNull();
  });

  it('client cannot create macrocycles (FORBIDDEN_ROLE)', async () => {
    const client = await loginAndGetSession(app, clientUser.login, CLIENT_TEST_PASSWORD);

    const res = await request(app.getHttpServer())
      .post('/api/macrocycles')
      .set('Cookie', client.cookiePairs)
      .set('x-csrf-token', client.csrfToken)
      .send({
        name: 'Запрещено',
        stages: [],
      });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
