import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutStatus } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { MembershipDebitHookService } from '../membership/membership-debit-hook.service';
import { WorkoutIdempotencyService } from './workout-idempotency.service';
import { WorkoutsService } from './workouts.service';

type StoredStage = {
  id: string;
  macrocycleId: string;
  templateId: string;
  sortOrder: number;
};

type StoredProgress = {
  id: string;
  clientProfileId: string;
  macrocycleId: string;
  currentStageId: string | null;
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

describe('WorkoutsService.markAttended', () => {
  let service: WorkoutsService;
  const stages = new Map<string, StoredStage>();
  const macroProgress = new Map<string, StoredProgress>();
  const workouts = new Map<string, StoredWorkout>();

  const prismaMock = {
    $transaction: async <T>(fn: (tx: typeof txMock) => Promise<T>): Promise<T> => fn(txMock),
  };

  const txMock = {
    workout: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = workouts.get(where.id);
        if (!row) {
          return null;
        }
        return { ...row, template: null };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: WorkoutStatus };
      }) => {
        const row = workouts.get(where.id);
        if (!row) {
          throw new Error('missing');
        }
        const updated = { ...row, status: data.status, updatedAt: new Date() };
        workouts.set(where.id, updated);
        return { ...updated, template: null };
      },
    },
    clientMacroProgress: {
      findUnique: async ({ where }: { where: { clientProfileId: string } }) => {
        return [...macroProgress.values()].find((p) => p.clientProfileId === where.clientProfileId) ?? null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { clientProfileId: string };
        data: { currentStageId: string | null };
      }) => {
        const row = [...macroProgress.values()].find((p) => p.clientProfileId === where.clientProfileId);
        if (!row) {
          throw new Error('missing progress');
        }
        const updated = { ...row, currentStageId: data.currentStageId };
        macroProgress.set(row.id, updated);
        return updated;
      },
    },
    macrocycleStage: {
      findUnique: async ({ where }: { where: { id: string } }) => stages.get(where.id) ?? null,
      findMany: async ({
        where,
        orderBy,
      }: {
        where: { macrocycleId: string };
        orderBy: { sortOrder: 'asc' };
      }) => {
        return [...stages.values()]
          .filter((s) => s.macrocycleId === where.macrocycleId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },
    },
  };

  beforeEach(async () => {
    stages.clear();
    macroProgress.clear();
    workouts.clear();

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

    macroProgress.set('cmp_1', {
      id: 'cmp_1',
      clientProfileId: 'client_1',
      macrocycleId: 'macro_1',
      currentStageId: 'stage_1',
    });

    const now = new Date();
    workouts.set('wo_1', {
      id: 'wo_1',
      clientProfileId: 'client_1',
      scheduledAt: now,
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: 'stage_1',
      createdByUserId: 'trainer_1',
      createdAt: now,
      updatedAt: now,
    });

    const membershipHook = {
      onWorkoutStarted: vi.fn(),
      onWorkoutSkipped: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ClientsLockService, useValue: {} },
        { provide: WorkoutIdempotencyService, useValue: {} },
        { provide: MembershipDebitHookService, useValue: membershipHook },
      ],
    }).compile();

    service = moduleRef.get(WorkoutsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks pending attended and advances stage when source matches current', async () => {
    const dto = await service.markAttended('wo_1');
    expect(dto.status).toBe('attended');
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_2');
  });

  it('sets currentStageId null when last stage attended', async () => {
    macroProgress.set('cmp_1', {
      ...macroProgress.get('cmp_1')!,
      currentStageId: 'stage_2',
    });
    workouts.set('wo_1', {
      ...workouts.get('wo_1')!,
      sourceStageId: 'stage_2',
    });

    await service.markAttended('wo_1');
    expect(macroProgress.get('cmp_1')?.currentStageId).toBeNull();
  });

  it('attends without moving pointer when sourceStageId mismatches current', async () => {
    workouts.set('wo_1', {
      ...workouts.get('wo_1')!,
      sourceStageId: 'stage_2',
    });

    await service.markAttended('wo_1');
    expect(workouts.get('wo_1')?.status).toBe(WorkoutStatus.attended);
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });

  it('attends without pointer change when no sourceStageId', async () => {
    workouts.set('wo_1', {
      ...workouts.get('wo_1')!,
      sourceStageId: null,
    });

    await service.markAttended('wo_1');
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });
});

describe('WorkoutsService skip membership debit hook', () => {
  let service: WorkoutsService;
  const onWorkoutSkipped = vi.fn(async () => undefined);
  const workouts = new Map<string, StoredWorkout>();

  const prismaMock = {
    workout: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = workouts.get(where.id);
        return row ? { ...row, template: null } : null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: WorkoutStatus };
      }) => {
        const row = workouts.get(where.id)!;
        const updated = { ...row, status: data.status };
        workouts.set(where.id, updated);
        return { ...updated, template: null };
      },
    },
  };

  beforeEach(async () => {
    onWorkoutSkipped.mockClear();
    workouts.clear();
    const now = new Date();
    workouts.set('wo_skip', {
      id: 'wo_skip',
      clientProfileId: 'client_1',
      scheduledAt: now,
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: null,
      createdByUserId: 'trainer_1',
      createdAt: now,
      updatedAt: now,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ClientsLockService,
          useValue: { assertActorHoldsLiveLock: async () => undefined },
        },
        {
          provide: WorkoutIdempotencyService,
          useValue: { findReplay: async () => null, store: async () => undefined },
        },
        {
          provide: MembershipDebitHookService,
          useValue: { onWorkoutStarted: vi.fn(), onWorkoutSkipped },
        },
      ],
    }).compile();

    service = moduleRef.get(WorkoutsService);
  });

  it('calls onWorkoutSkipped after workout status becomes skipped', async () => {
    await service.skip('wo_skip', 'trainer_1', 'idem-skip');

    expect(onWorkoutSkipped).toHaveBeenCalledOnce();
    expect(onWorkoutSkipped).toHaveBeenCalledWith('client_1', 'wo_skip');
  });
});

describe('WorkoutsService skip/cancel do not advance stage', () => {
  let service: WorkoutsService;
  const macroProgress = new Map<string, StoredProgress>();
  const workouts = new Map<string, StoredWorkout>();

  const prismaMock = {
    workout: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = workouts.get(where.id);
        return row ? { ...row, template: null } : null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: WorkoutStatus };
      }) => {
        const row = workouts.get(where.id)!;
        const updated = { ...row, status: data.status };
        workouts.set(where.id, updated);
        return { ...updated, template: null };
      },
    },
    clientMacroProgress: {
      findUnique: async () => macroProgress.get('cmp_1') ?? null,
      update: async () => {
        throw new Error('should not advance on skip/cancel');
      },
    },
  };

  beforeEach(async () => {
    macroProgress.clear();
    workouts.clear();
    macroProgress.set('cmp_1', {
      id: 'cmp_1',
      clientProfileId: 'client_1',
      macrocycleId: 'macro_1',
      currentStageId: 'stage_1',
    });
    const now = new Date();
    workouts.set('wo_skip', {
      id: 'wo_skip',
      clientProfileId: 'client_1',
      scheduledAt: now,
      status: WorkoutStatus.pending,
      templateId: 'tpl_1',
      sourceStageId: 'stage_1',
      createdByUserId: 'trainer_1',
      createdAt: now,
      updatedAt: now,
    });

    const idempotency = {
      findReplay: async () => null,
      store: async () => undefined,
    };
    const lock = {
      assertActorHoldsLiveLock: async () => undefined,
    };

    const membershipHook = {
      onWorkoutStarted: vi.fn(),
      onWorkoutSkipped: vi.fn(async () => undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ClientsLockService, useValue: lock },
        { provide: WorkoutIdempotencyService, useValue: idempotency },
        { provide: MembershipDebitHookService, useValue: membershipHook },
      ],
    }).compile();

    service = moduleRef.get(WorkoutsService);
  });

  it('skip leaves currentStageId unchanged', async () => {
    await service.skip('wo_skip', 'trainer_1', 'idem-skip');
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });

  it('cancel leaves currentStageId unchanged', async () => {
    workouts.set('wo_cancel', { ...workouts.get('wo_skip')!, id: 'wo_cancel' });
    await service.cancel('wo_cancel', 'trainer_1', 'idem-cancel');
    expect(macroProgress.get('cmp_1')?.currentStageId).toBe('stage_1');
  });
});

describe('WorkoutsService.markAttended errors', () => {
  it('throws NOT_FOUND for missing workout', async () => {
    const prismaMock = {
      $transaction: async <T>(fn: (tx: { workout: { findUnique: () => Promise<null> } }) => Promise<T>) =>
        fn({ workout: { findUnique: async () => null } }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ClientsLockService, useValue: {} },
        { provide: WorkoutIdempotencyService, useValue: {} },
        {
          provide: MembershipDebitHookService,
          useValue: { onWorkoutStarted: vi.fn(), onWorkoutSkipped: vi.fn() },
        },
      ],
    }).compile();
    const service = moduleRef.get(WorkoutsService);

    await expect(service.markAttended('missing')).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });
});
