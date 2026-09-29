import { Injectable } from '@nestjs/common';
import { SessionStatus, WorkoutStatus } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { SessionDto } from './dto/session.dto';
import { DEFAULT_SESSION_DURATION_MINUTES } from './sessions.constants';
import { toSessionDto } from './session.mapper';

const sessionWithExercisesInclude = {
  exercises: true,
} as const;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsLockService: ClientsLockService,
  ) {}

  /**
   * Starts an active session for a pending workout with immutable exercise snapshot (AD-7).
   */
  async startFromWorkout(workoutId: string, actorUserId: string): Promise<SessionDto> {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
    });
    if (!workout) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout not found', 404);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(workout.clientProfileId, actorUserId);

    if (workout.status !== WorkoutStatus.pending) {
      throw new AppException(ErrorCode.WORKOUT_STATUS_CONFLICT, 'Workout is not pending', 409);
    }

    if (!workout.templateId) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Workout has no template', 400);
    }

    const existing = await this.prisma.session.findUnique({
      where: { workoutId },
    });
    if (existing?.status === SessionStatus.active) {
      throw new AppException(ErrorCode.SESSION_ALREADY_ACTIVE, 'Session already active', 409);
    }
    if (existing) {
      throw new AppException(ErrorCode.SESSION_ALREADY_ACTIVE, 'Session already exists for workout', 409);
    }

    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id: workout.templateId },
      select: { durationMinutes: true },
    });
    if (!template) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Template not found', 400);
    }

    const templateExercises = await this.prisma.templateExercise.findMany({
      where: { templateId: workout.templateId },
      orderBy: { sortOrder: 'asc' },
      include: { exercise: { select: { name: true } } },
    });

    const plannedDurationMinutes =
      template.durationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES;
    const startedAt = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          workoutId: workout.id,
          clientProfileId: workout.clientProfileId,
          authorTrainerId: actorUserId,
          status: SessionStatus.active,
          startedAt,
          plannedDurationMinutes,
        },
      });

      if (templateExercises.length > 0) {
        await tx.sessionExercise.createMany({
          data: templateExercises.map((te) => ({
            sessionId: session.id,
            exerciseId: te.exerciseId,
            sortOrder: te.sortOrder,
            plannedSets: te.plannedSets,
            plannedReps: te.plannedReps,
            plannedWeightKg: te.plannedWeightKg,
            nameSnapshot: te.exercise.name,
            notes: te.notes,
          })),
        });
      }

      await tx.clientLock.update({
        where: { clientId: workout.clientProfileId },
        data: { activeSessionId: session.id },
      });

      return tx.session.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionWithExercisesInclude,
      });
    });

    return toSessionDto(created);
  }

  async getById(sessionId: string, actorUserId: string): Promise<SessionDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: sessionWithExercisesInclude,
    });
    if (!session) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session not found', 404);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(session.clientProfileId, actorUserId);

    return toSessionDto(session);
  }
}
