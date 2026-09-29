import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma, SessionStatus } from '@prisma/client';
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
  plannedSets: number | null;
  plannedReps: number | null;
  plannedWeightKg: Prisma.Decimal | null;
  nameSnapshot: string;
  notes: string | null;
};

type StoredSetModifier = {
  id: string;
  name: string;
  colorToken: string;
  archivedAt: Date | null;
};

type StoredSet = {
  id: string;
  sessionId: string;
  sessionExerciseId: string;
  sequenceIndex: number;
  weightKg: Prisma.Decimal | null;
  reps: number | null;
  rpe: Prisma.Decimal | null;
  modifierId: string | null;
  modifier?: StoredSetModifier | null;
  createdAt: Date;
  updatedAt: Date;
};

describe('SessionsService sets upsert', () => {
  let service: SessionsService;
  const sessions = new Map<string, StoredSession>();
  const sessionExercises = new Map<string, StoredSessionExercise>();
  const sets = new Map<string, StoredSet>();
  const setModifiers = new Map<string, StoredSetModifier>();

  const txMock = {
    set: {
      findUnique: async ({ where }: { where: { id: string } }) => sets.get(where.id) ?? null,
      aggregate: async ({
        where,
        _max,
      }: {
        where: { sessionId: string };
        _max: { sequenceIndex: true };
      }) => {
        const rows = [...sets.values()].filter((s) => s.sessionId === where.sessionId);
        const max = rows.reduce((acc, r) => Math.max(acc, r.sequenceIndex), 0);
        return { _max: { sequenceIndex: rows.length === 0 ? null : max } };
      },
      create: async ({
        data,
      }: {
        data: {
          id: string;
          sessionId: string;
          sessionExerciseId: string;
          sequenceIndex: number;
          weightKg?: Prisma.Decimal | null;
          reps?: number | null;
          rpe?: Prisma.Decimal | null;
          modifierId?: string | null;
        };
      }) => {
        const now = new Date();
        const modifierId = data.modifierId ?? null;
        const row: StoredSet = {
          id: data.id,
          sessionId: data.sessionId,
          sessionExerciseId: data.sessionExerciseId,
          sequenceIndex: data.sequenceIndex,
          weightKg: data.weightKg ?? null,
          reps: data.reps ?? null,
          rpe: data.rpe ?? null,
          modifierId,
          modifier:
            modifierId != null ? setModifiers.get(modifierId) ?? null : null,
          createdAt: now,
          updatedAt: now,
        };
        sets.set(row.id, row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<
          Pick<
            StoredSet,
            'sessionExerciseId' | 'weightKg' | 'reps' | 'rpe' | 'modifierId' | 'updatedAt'
          >
        >;
      }) => {
        const row = sets.get(where.id);
        if (!row) {
          throw new Error('missing set');
        }
        const updated = {
          ...row,
          ...data,
          modifier:
            data.modifierId !== undefined
              ? data.modifierId != null
                ? setModifiers.get(data.modifierId) ?? null
                : null
              : row.modifier,
          updatedAt: data.updatedAt ?? new Date(),
        };
        sets.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const row = sets.get(where.id);
        if (!row) {
          throw new Error('missing');
        }
        sets.delete(where.id);
        return row;
      },
    },
  };

  const prismaMock = {
    session: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { exercises?: boolean; sets?: boolean };
      }) => {
        const row = sessions.get(where.id);
        if (!row) {
          return null;
        }
        const result: Record<string, unknown> = { ...row };
        if (include?.exercises) {
          result.exercises = [...sessionExercises.values()].filter((e) => e.sessionId === row.id);
        }
        if (include?.sets) {
          result.sets = [...sets.values()]
            .filter((s) => s.sessionId === row.id)
            .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
        }
        return result;
      },
    },
    sessionExercise: {
      findFirst: async ({
        where,
      }: {
        where: { id: string; sessionId: string };
      }) => {
        const row = sessionExercises.get(where.id);
        if (!row || row.sessionId !== where.sessionId) {
          return null;
        }
        return row;
      },
    },
    set: txMock.set,
    setModifier: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        setModifiers.get(where.id) ?? null,
    },
    $transaction: async <T>(fn: (tx: typeof txMock) => Promise<T>): Promise<T> => fn(txMock),
  };

  beforeEach(async () => {
    sessions.clear();
    sessionExercises.clear();
    sets.clear();
    setModifiers.clear();
    setModifiers.set('mod_active', {
      id: 'mod_active',
      name: 'Дроп',
      colorToken: 'mod-teal',
      archivedAt: null,
    });

    const now = new Date();
    sessions.set('sess_1', {
      id: 'sess_1',
      workoutId: 'wo_1',
      clientProfileId: 'client_pool_1',
      authorTrainerId: 'user_trainer_1',
      status: SessionStatus.active,
      startedAt: now,
      completedAt: null,
      abandonedAt: null,
      plannedDurationMinutes: 45,
      createdAt: now,
      updatedAt: now,
    });
    sessionExercises.set('se_1', {
      id: 'se_1',
      sessionId: 'sess_1',
      exerciseId: 'ex_1',
      sortOrder: 0,
      plannedSets: 3,
      plannedReps: 10,
      plannedWeightKg: null,
      nameSnapshot: 'Жим',
      notes: null,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ClientsLockService,
          useValue: { assertActorHoldsLiveLock: vi.fn(async () => undefined) },
        },
        {
          provide: WorkoutsService,
          useValue: { markAttended: vi.fn() },
        },
        {
          provide: MembershipDebitHookService,
          useValue: { onWorkoutStarted: vi.fn(), onWorkoutSkipped: vi.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(SessionsService);
  });

  it('duplicate setId upsert does not create a second row', async () => {
    const setId = '550e8400-e29b-41d4-a716-446655440000';
    const body = { sessionExerciseId: 'se_1', weightKg: 60, reps: 10, rpe: 8 };

    await service.upsertSet('sess_1', setId, 'user_trainer_1', body);
    await service.upsertSet('sess_1', setId, 'user_trainer_1', body);

    expect(sets.size).toBe(1);
    expect([...sets.values()][0].sequenceIndex).toBe(1);
  });

  it('assigns monotonic sequenceIndex for new sets in one session', async () => {
    await service.upsertSet('sess_1', '550e8400-e29b-41d4-a716-446655440001', 'user_trainer_1', {
      sessionExerciseId: 'se_1',
      reps: 8,
    });
    await service.upsertSet('sess_1', '550e8400-e29b-41d4-a716-446655440002', 'user_trainer_1', {
      sessionExerciseId: 'se_1',
      reps: 7,
    });

    const indices = [...sets.values()]
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
      .map((s) => s.sequenceIndex);
    expect(indices).toEqual([1, 2]);
  });

  it('update keeps sequenceIndex unchanged', async () => {
    const setId = '550e8400-e29b-41d4-a716-446655440003';
    await service.upsertSet('sess_1', setId, 'user_trainer_1', {
      sessionExerciseId: 'se_1',
      reps: 10,
    });
    await service.upsertSet('sess_1', setId, 'user_trainer_1', {
      sessionExerciseId: 'se_1',
      reps: 12,
    });

    expect(sets.get(setId)?.sequenceIndex).toBe(1);
    expect(sets.get(setId)?.reps).toBe(12);
  });

  it('rejects upsert when session is abandoned', async () => {
    sessions.set('sess_1', { ...sessions.get('sess_1')!, status: SessionStatus.abandoned });

    await expect(
      service.upsertSet('sess_1', '550e8400-e29b-41d4-a716-446655440004', 'user_trainer_1', {
        sessionExerciseId: 'se_1',
        reps: 5,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.SESSION_ABANDONED });
  });

  it('rejects upsert when session is completed', async () => {
    sessions.set('sess_1', { ...sessions.get('sess_1')!, status: SessionStatus.completed });

    await expect(
      service.upsertSet('sess_1', '550e8400-e29b-41d4-a716-446655440005', 'user_trainer_1', {
        sessionExerciseId: 'se_1',
        reps: 5,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.WORKOUT_STATUS_CONFLICT });
  });

  it('attaches modifier on upsert and returns summary on SetDto', async () => {
    const setId = '550e8400-e29b-41d4-a716-446655440010';
    const dto = await service.upsertSet('sess_1', setId, 'user_trainer_1', {
      sessionExerciseId: 'se_1',
      reps: 8,
      modifierId: 'mod_active',
    });

    expect(dto.modifier).toEqual({
      id: 'mod_active',
      name: 'Дроп',
      colorToken: 'mod-teal',
    });
    expect(sets.get(setId)?.modifierId).toBe('mod_active');
  });

  it('rejects archived modifier on attach', async () => {
    setModifiers.set('mod_archived', {
      id: 'mod_archived',
      name: 'Old',
      colorToken: 'mod-sky',
      archivedAt: new Date(),
    });

    await expect(
      service.upsertSet('sess_1', '550e8400-e29b-41d4-a716-446655440011', 'user_trainer_1', {
        sessionExerciseId: 'se_1',
        reps: 5,
        modifierId: 'mod_archived',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });
});
