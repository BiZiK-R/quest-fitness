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

type StoredMacrocycle = {
  id: string;
  name: string;
  periodicityNote: string | null;
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

function stagesForMacro(
  macroId: string,
  stageMap: Map<string, StoredMacrocycleStage>,
): StoredMacrocycleStage[] {
  return [...stageMap.values()]
    .filter((s) => s.macrocycleId === macroId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

describe('ClientMacroProgressController (HTTP)', () => {
  let app: INestApplication;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const clientProfiles = new Map<string, StoredClientProfile>();
  const clientLocks = new Map<string, StoredClientLock>();
  const macrocycles = new Map<string, StoredMacrocycle>();
  const stages = new Map<string, StoredMacrocycleStage>();
  const macroProgress = new Map<string, StoredClientMacroProgress>();

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
    macrocycle: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { stages?: { orderBy?: { sortOrder: 'asc' } } };
      }) => {
        const macro = macrocycles.get(where.id);
        if (!macro) {
          return null;
        }
        const stageList = stagesForMacro(macro.id, stages);
        if (include?.stages) {
          return { ...macro, stages: stageList };
        }
        return { ...macro };
      },
    },
    clientMacroProgress: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { clientProfileId: string };
        include?: {
          macrocycle?: { include?: { stages?: { orderBy?: { sortOrder: 'asc' } } } };
        };
      }) => {
        const row = [...macroProgress.values()].find(
          (p) => p.clientProfileId === where.clientProfileId,
        );
        if (!row) {
          return null;
        }
        if (include?.macrocycle) {
          const macro = macrocycles.get(row.macrocycleId);
          if (!macro) {
            return { ...row, macrocycle: null };
          }
          return {
            ...row,
            macrocycle: {
              ...macro,
              stages: stagesForMacro(macro.id, stages),
            },
          };
        }
        return { ...row };
      },
      upsert: async ({
        where,
        create,
        update,
        include,
      }: {
        where: { clientProfileId: string };
        create: {
          clientProfileId: string;
          macrocycleId: string;
          currentStageId: string | null;
        };
        update: { macrocycleId: string; currentStageId: string | null };
        include?: {
          macrocycle?: { include?: { stages?: { orderBy?: { sortOrder: 'asc' } } } };
        };
      }) => {
        const existing = [...macroProgress.values()].find(
          (p) => p.clientProfileId === where.clientProfileId,
        );
        let row: StoredClientMacroProgress;
        if (existing) {
          row = {
            ...existing,
            macrocycleId: update.macrocycleId,
            currentStageId: update.currentStageId,
          };
          macroProgress.set(existing.id, row);
        } else {
          row = {
            id: `cmp_${macroProgress.size + 1}`,
            clientProfileId: create.clientProfileId,
            macrocycleId: create.macrocycleId,
            currentStageId: create.currentStageId,
          };
          macroProgress.set(row.id, row);
        }
        if (include?.macrocycle) {
          const macro = macrocycles.get(row.macrocycleId)!;
          return {
            ...row,
            macrocycle: { ...macro, stages: stagesForMacro(macro.id, stages) },
          };
        }
        return row;
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { clientProfileId: string };
        data: { currentStageId: string | null };
        include?: {
          macrocycle?: { include?: { stages?: { orderBy?: { sortOrder: 'asc' } } } };
        };
      }) => {
        const existing = [...macroProgress.values()].find(
          (p) => p.clientProfileId === where.clientProfileId,
        );
        if (!existing) {
          throw new Error('progress not found');
        }
        const row = { ...existing, currentStageId: data.currentStageId };
        macroProgress.set(existing.id, row);
        if (include?.macrocycle) {
          const macro = macrocycles.get(row.macrocycleId)!;
          return {
            ...row,
            macrocycle: { ...macro, stages: stagesForMacro(macro.id, stages) },
          };
        }
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

  beforeEach(() => {
    sessions.clear();
    clientProfiles.clear();
    clientLocks.clear();
    macrocycles.clear();
    stages.clear();
    macroProgress.clear();

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
    macrocycles.set('macro_1', {
      id: 'macro_1',
      name: 'Силовой сезон',
      periodicityNote: null,
    });
    stages.set('stage_1', {
      id: 'stage_1',
      macrocycleId: 'macro_1',
      templateId: 'tpl_1',
      sortOrder: 0,
    });
    stages.set('stage_2', {
      id: 'stage_2',
      macrocycleId: 'macro_1',
      templateId: 'tpl_2',
      sortOrder: 1,
    });
    macrocycles.set('macro_other', {
      id: 'macro_other',
      name: 'Другой',
      periodicityNote: null,
    });
    stages.set('stage_foreign', {
      id: 'stage_foreign',
      macrocycleId: 'macro_other',
      templateId: 'tpl_x',
      sortOrder: 0,
    });
  });

  it('assign without live lock returns LOCK_REQUIRED', async () => {
    clientLocks.clear();
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1' });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe(ErrorCode.LOCK_REQUIRED);
  });

  it('assign with lock sets currentStageId to first stage by sortOrder', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1' });

    expect(res.status).toBe(200);
    expect(res.body.macrocycleId).toBe('macro_1');
    expect(res.body.currentStageId).toBe('stage_1');
    expect(res.body.stagesExhausted).toBe(false);
    expect(res.body.stageCount).toBe(2);
  });

  it('patch override updates currentStageId on same macrocycle', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1' });

    const patchRes = await request(app.getHttpServer())
      .patch('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ currentStageId: 'stage_2' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.currentStageId).toBe('stage_2');
    expect(patchRes.body.stagesExhausted).toBe(true);
  });

  it('assign with foreign stage returns VALIDATION_FAILED', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1', currentStageId: 'stage_foreign' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe(ErrorCode.VALIDATION_FAILED);
  });

  it('client role cannot assign (FORBIDDEN_ROLE)', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      clientUser.login,
      CLIENT_TEST_PASSWORD,
    );

    const res = await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });

  it('GET client profile includes macroProgress with stagesExhausted on last stage', async () => {
    const { csrfToken, cookiePairs } = await loginAndGetSession(
      app,
      trainerUser.login,
      TRAINER_PASSWORD,
    );

    await request(app.getHttpServer())
      .put('/api/clients/client_pool_1/macro-progress')
      .set('Cookie', cookiePairs)
      .set('x-csrf-token', csrfToken)
      .send({ macrocycleId: 'macro_1', currentStageId: 'stage_2' });

    const getRes = await request(app.getHttpServer())
      .get('/api/clients/client_pool_1')
      .set('Cookie', cookiePairs);

    expect(getRes.status).toBe(200);
    expect(getRes.body.macroProgress?.stagesExhausted).toBe(true);
    expect(getRes.body.macroProgress?.macrocycleName).toBe('Силовой сезон');
  });
});
