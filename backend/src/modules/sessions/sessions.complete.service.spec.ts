import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma, SessionStatus, UserRole, WorkoutStatus } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { MembershipDebitHookService } from '../membership/membership-debit-hook.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { SessionsService } from './sessions.service';

type StoredSession = {
  id: string;
  workoutId: string;
  clientProfileId: string;
  authorTrainerId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  abandonedAt: Date | null;
  plannedDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

type StoredSessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  sortOrder: number;
  nameSnapshot: string;
};

type StoredSet = {
  id: string;
  sessionId: string;
  sessionExerciseId: string;
  sequenceIndex: number;
  weightKg: Prisma.Decimal | null;
  reps: number | null;
};

describe('SessionsService.complete', () => {
  let service: SessionsService;
  const sessions = new Map<string, StoredSession>();
  const sessionExercises = new Map<string, StoredSessionExercise>();
  const sets = new Map<string, StoredSet>();

  const markAttended = vi.fn();
  const releaseLock = vi.fn();
  const assertLock = vi.fn();

  const prismaMock = {
    session: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: {
          exercises?: boolean;
          sets?: boolean;
        };
      }) => {
        const row = sessions.get(where.id);
        if (!row) {
          return null;
        }
        const result: Record<string, unknown> = { ...row };
        if (include?.exercises) {
          result.exercises = [...sessionExercises.values()]
            .filter((e) => e.sessionId === row.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        }
        if (include?.sets) {
          result.sets = [...sets.values()].filter((s) => s.sessionId === row.id);
        }
        return result;
      },
      findMany: async ({
        where,
        orderBy,
        include,
      }: {
        where: {
          clientProfileId: string;
          status: SessionStatus;
          id?: { not: string };
        };
        orderBy?: { completedAt: 'desc' };
        include?: { exercises?: boolean; sets?: boolean };
      }) => {
        let rows = [...sessions.values()].filter(
          (s) =>
            s.clientProfileId === where.clientProfileId &&
            s.status === where.status &&
            (where.id?.not ? s.id !== where.id.not : true),
        );
        if (orderBy?.completedAt === 'desc') {
          rows = rows.sort(
            (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
          );
        }
        return rows.map((row) => {
          const result: Record<string, unknown> = { ...row };
          if (include?.exercises) {
            result.exercises = [...sessionExercises.values()].filter((e) => e.sessionId === row.id);
          }
          if (include?.sets) {
            result.sets = [...sets.values()].filter((s) => s.sessionId === row.id);
          }
          return result;
        });
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: SessionStatus; completedAt?: Date };
      }) => {
        const row = sessions.get(where.id);
        if (!row) {
          throw new Error('Session not found');
        }
        const updated = { ...row, ...data, updatedAt: new Date() };
        sessions.set(where.id, updated);
        return updated;
      },
    },
  };

  beforeEach(async () => {
    sessions.clear();
    sessionExercises.clear();
    sets.clear();
    markAttended.mockReset();
    releaseLock.mockReset();
    assertLock.mockReset();
    assertLock.mockResolvedValue(undefined);
    markAttended.mockResolvedValue({ id: 'wo_1', status: WorkoutStatus.attended });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ClientsLockService,
          useValue: {
            assertActorHoldsLiveLock: assertLock,
            release: releaseLock,
          },
        },
        {
          provide: WorkoutsService,
          useValue: { markAttended },
        },
        {
          provide: MembershipDebitHookService,
          useValue: { onWorkoutStarted: vi.fn(), onWorkoutSkipped: vi.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(SessionsService);

    sessions.set('sess_1', {
      id: 'sess_1',
      workoutId: 'wo_1',
      clientProfileId: 'client_1',
      authorTrainerId: 'trainer_1',
      status: SessionStatus.active,
      startedAt: new Date(),
      completedAt: null,
      abandonedAt: null,
      plannedDurationMinutes: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionExercises.set('se_1', {
      id: 'se_1',
      sessionId: 'sess_1',
      exerciseId: 'ex_1',
      sortOrder: 0,
      nameSnapshot: 'Жим',
    });
    sets.set('set_1', {
      id: 'set_1',
      sessionId: 'sess_1',
      sessionExerciseId: 'se_1',
      sequenceIndex: 1,
      weightKg: new Prisma.Decimal(50),
      reps: 10,
    });
  });

  it('completes active session, marks attended, releases lock, returns summary', async () => {
    const summary = await service.complete('sess_1', 'trainer_1', UserRole.TRAINER);

    expect(assertLock).toHaveBeenCalledWith('client_1', 'trainer_1');
    expect(markAttended).toHaveBeenCalledWith('wo_1');
    expect(releaseLock).toHaveBeenCalledWith('client_1', 'trainer_1', UserRole.TRAINER, false);
    expect(sessions.get('sess_1')?.status).toBe(SessionStatus.completed);
    expect(summary.setCount).toBe(1);
    expect(summary.totalTonnageKg).toBe(500);
    expect(summary.perExercise[0].firstTime).toBe(true);
  });

  it('rejects abandoned session', async () => {
    sessions.set('sess_1', { ...sessions.get('sess_1')!, status: SessionStatus.abandoned });

    await expect(service.complete('sess_1', 'trainer_1', UserRole.TRAINER)).rejects.toMatchObject({
      code: ErrorCode.SESSION_ABANDONED,
    });
    expect(markAttended).not.toHaveBeenCalled();
  });

  it('returns summary idempotently when already completed', async () => {
    sessions.set('sess_1', {
      ...sessions.get('sess_1')!,
      status: SessionStatus.completed,
      completedAt: new Date(),
    });

    const summary = await service.complete('sess_1', 'trainer_1', UserRole.TRAINER);

    expect(assertLock).not.toHaveBeenCalled();
    expect(markAttended).not.toHaveBeenCalled();
    expect(summary.totalTonnageKg).toBe(500);
  });
});
