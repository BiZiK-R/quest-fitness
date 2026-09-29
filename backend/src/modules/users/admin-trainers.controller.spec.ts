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

describe('AdminTrainersController (HTTP)', () => {
  let app: INestApplication;
  let adminUser: TestUserRecord;
  let trainerUser: TestUserRecord;
  let clientUser: TestUserRecord;
  const sessions = new Map<string, StoredSession>();
  const staffUsers = new Map<string, TestUserRecord>();

  function allUsers(): TestUserRecord[] {
    return [...staffUsers.values(), clientUser];
  }

  const usersById = () => new Map(allUsers().map((u) => [u.id, u as User]));

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
      findMany: async ({
        where,
        select,
        orderBy,
      }: {
        where?: { role?: { in: UserRole[] } };
        select?: { id?: boolean; login?: boolean; role?: boolean };
        orderBy?: { login: 'asc' | 'desc' };
      }) => {
        let rows = users.filter(
          (u) =>
            u.role === UserRole.TRAINER || u.role === UserRole.ADMIN,
        );
        if (where?.role?.in) {
          rows = rows.filter((u) => where.role!.in.includes(u.role));
        }
        if (orderBy?.login === 'asc') {
          rows = [...rows].sort((a, b) => a.login.localeCompare(b.login));
        }
        if (select) {
          return rows.map((u) => {
            const out: Record<string, unknown> = {};
            if (select.id) {
              out.id = u.id;
            }
            if (select.login) {
              out.login = u.login;
            }
            if (select.role) {
              out.role = u.role;
            }
            return out;
          });
        }
        return rows;
      },
      create: async ({
        data,
      }: {
        data: {
          login: string;
          passwordHash: string;
          role: UserRole;
          phoneE164?: string | null;
        };
      }) => {
        const id = `user_staff_${staffUsers.size + 10}`;
        const row: TestUserRecord = {
          id,
          login: data.login,
          phoneE164: data.phoneE164 ?? null,
          passwordHash: data.passwordHash,
          role: data.role,
        };
        staffUsers.set(id, row);
        return { ...row, createdAt: new Date(), updatedAt: new Date() };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { role?: UserRole; passwordHash?: string };
      }) => {
        const row =
          staffUsers.get(where.id) ?? allUsers().find((u) => u.id === where.id);
        if (!row || !staffUsers.has(row.id)) {
          const clientHit = clientUser.id === where.id ? clientUser : null;
          if (clientHit && data.passwordHash) {
            clientUser = { ...clientUser, passwordHash: data.passwordHash };
            return { ...clientUser };
          }
          throw new Error('user not found');
        }
        const updated = {
          ...row,
          ...(data.role !== undefined ? { role: data.role } : {}),
          ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        };
        staffUsers.set(where.id, updated);
        return { ...updated, updatedAt: new Date() };
      },
    };
  }

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    get user() {
      return buildUserLookup(allUsers());
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
    staffUsers.clear();
    staffUsers.set(trainerUser.id, trainerUser);
    staffUsers.set(adminUser.id, adminUser);
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

  beforeEach(() => {
    sessions.clear();
  });

  it('admin creates trainer with lowercase login', async () => {
    const admin = await loginAndGetSession(app, adminUser.login, ADMIN_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/admin/trainers')
      .set('Cookie', admin.cookiePairs)
      .set('x-csrf-token', admin.csrfToken)
      .send({ login: 'NewTrainer', password: 'NewPass123!' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.login).toBe('newtrainer');
    expect(createRes.body.role).toBe(UserRole.TRAINER);
    expect(createRes.body.id).toBeTypeOf('string');

    const verify = await argon2.verify(
      staffUsers.get(createRes.body.id as string)!.passwordHash,
      'NewPass123!',
    );
    expect(verify).toBe(true);
  });

  it('admin lists trainers and admins', async () => {
    const admin = await loginAndGetSession(app, adminUser.login, ADMIN_PASSWORD);

    const listRes = await request(app.getHttpServer())
      .get('/api/admin/trainers')
      .set('Cookie', admin.cookiePairs)
      .set('x-csrf-token', admin.csrfToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.trainers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: adminUser.id, role: UserRole.ADMIN }),
        expect.objectContaining({ id: trainerUser.id, role: UserRole.TRAINER }),
      ]),
    );
  });

  it('admin promotes trainer to admin', async () => {
    const admin = await loginAndGetSession(app, adminUser.login, ADMIN_PASSWORD);

    const promoteRes = await request(app.getHttpServer())
      .post(`/api/admin/trainers/${trainerUser.id}/promote`)
      .set('Cookie', admin.cookiePairs)
      .set('x-csrf-token', admin.csrfToken)
      .send({});

    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.role).toBe(UserRole.ADMIN);
    expect(staffUsers.get(trainerUser.id)?.role).toBe(UserRole.ADMIN);
  });

  it('trainer cannot access admin trainer routes (FORBIDDEN_ROLE)', async () => {
    staffUsers.set(trainerUser.id, {
      ...trainerUser,
      role: UserRole.TRAINER,
    });
    const trainer = await loginAndGetSession(app, trainerUser.login, TRAINER_PASSWORD);

    const createRes = await request(app.getHttpServer())
      .post('/api/admin/trainers')
      .set('Cookie', trainer.cookiePairs)
      .set('x-csrf-token', trainer.csrfToken)
      .send({ login: 'blocked', password: 'Blocked123!' });

    expect(createRes.status).toBe(403);
    expect(createRes.body.error?.code).toBe(ErrorCode.FORBIDDEN_ROLE);
  });
});
