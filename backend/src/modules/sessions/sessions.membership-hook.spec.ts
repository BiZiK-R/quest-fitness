import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStatus, WorkoutStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { MembershipDebitHookService } from '../membership/membership-debit-hook.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { SessionsService } from './sessions.service';

describe('SessionsService membership debit hook', () => {
  let service: SessionsService;
  const onWorkoutStarted = vi.fn(async () => undefined);

  const clientProfileId = 'client_1';
  const workoutId = 'wo_1';
  const trainerId = 'trainer_1';

  const prismaMock = {
    workout: {
      findUnique: async () => ({
        id: workoutId,
        clientProfileId,
        status: WorkoutStatus.pending,
        templateId: 'tpl_1',
      }),
    },
    session: {
      findUnique: async () => null,
    },
    workoutTemplate: {
      findUnique: async () => ({ durationMinutes: 60 }),
    },
    templateExercise: {
      findMany: async () => [],
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        session: {
          create: async ({ data }: { data: { id?: string } }) => ({
            id: 'sess_1',
            workoutId: data,
            clientProfileId,
            authorTrainerId: trainerId,
            status: SessionStatus.active,
            startedAt: new Date(),
            plannedDurationMinutes: 60,
            exercises: [],
            sets: [],
          }),
          findUniqueOrThrow: async () => ({
            id: 'sess_1',
            workoutId,
            clientProfileId,
            authorTrainerId: trainerId,
            status: SessionStatus.active,
            startedAt: new Date(),
            completedAt: null,
            abandonedAt: null,
            plannedDurationMinutes: 60,
            exercises: [],
            sets: [],
          }),
        },
        sessionExercise: { createMany: async () => ({ count: 0 }) },
        clientLock: { update: async () => ({}) },
      };
      return fn(tx);
    },
  };

  beforeEach(async () => {
    onWorkoutStarted.mockClear();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ClientsLockService,
          useValue: { assertActorHoldsLiveLock: async () => undefined },
        },
        { provide: WorkoutsService, useValue: {} },
        {
          provide: MembershipDebitHookService,
          useValue: { onWorkoutStarted, onWorkoutSkipped: vi.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(SessionsService);
  });

  it('calls onWorkoutStarted after session is created', async () => {
    await service.startFromWorkout(workoutId, trainerId);

    expect(onWorkoutStarted).toHaveBeenCalledOnce();
    expect(onWorkoutStarted).toHaveBeenCalledWith(clientProfileId, workoutId);
  });
});
