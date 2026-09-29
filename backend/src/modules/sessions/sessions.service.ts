import { Injectable } from '@nestjs/common';
import { Prisma, Session, SessionStatus, UserRole, WorkoutStatus } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { SessionSummaryDto } from './dto/session-summary.dto';
import { SessionDto } from './dto/session.dto';
import { SetDto } from './dto/set.dto';
import { UpsertSetRequestDto } from './dto/upsert-set-request.dto';
import { buildSessionSummary } from './lib/session-summary.builder';
import { DEFAULT_SESSION_DURATION_MINUTES } from './sessions.constants';
import { toSessionDto, toSetDto } from './session.mapper';

const setWithModifierInclude = {
  modifier: true,
} as const;

const sessionWithExercisesInclude = {
  exercises: true,
  sets: {
    orderBy: { sequenceIndex: 'asc' as const },
    include: setWithModifierInclude,
  },
} as const;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsLockService: ClientsLockService,
    private readonly workoutsService: WorkoutsService,
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
            supersetGroupId: te.supersetGroupId,
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

  /**
   * Upserts a logged set by client setId (AD-8). Assigns sequenceIndex on first insert only.
   */
  async upsertSet(
    sessionId: string,
    setId: string,
    actorUserId: string,
    body: UpsertSetRequestDto,
  ): Promise<SetDto> {
    const session = await this.loadSessionForMutation(sessionId, actorUserId);
    this.assertSessionActiveForMutation(session);

    const sessionExercise = await this.prisma.sessionExercise.findFirst({
      where: { id: body.sessionExerciseId, sessionId },
    });
    if (!sessionExercise) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session exercise not found', 404);
    }

    const weightKg = body.weightKg != null ? new Prisma.Decimal(body.weightKg) : null;
    const rpe = body.rpe != null ? new Prisma.Decimal(body.rpe) : null;
    const reps = body.reps ?? null;
    const modifierId =
      body.modifierId !== undefined
        ? await this.resolveModifierIdForAttach(body.modifierId)
        : undefined;

    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.set.findUnique({ where: { id: setId } });
      if (existing) {
        if (existing.sessionId !== sessionId) {
          throw new AppException(ErrorCode.NOT_FOUND, 'Set not found', 404);
        }
        return tx.set.update({
          where: { id: setId },
          data: {
            sessionExerciseId: body.sessionExerciseId,
            weightKg,
            reps,
            rpe,
            ...(modifierId !== undefined ? { modifierId } : {}),
          },
          include: setWithModifierInclude,
        });
      }

      const agg = await tx.set.aggregate({
        where: { sessionId },
        _max: { sequenceIndex: true },
      });
      const nextIndex = (agg._max.sequenceIndex ?? 0) + 1;

      return tx.set.create({
        data: {
          id: setId,
          sessionId,
          sessionExerciseId: body.sessionExerciseId,
          sequenceIndex: nextIndex,
          weightKg,
          reps,
          rpe,
          modifierId: modifierId ?? null,
        },
        include: setWithModifierInclude,
      });
    });

    return toSetDto(row);
  }

  /**
   * Completes an active session: attended workout, lock release, tonnage summary (AD-15, AD-7, AD-20).
   */
  async complete(
    sessionId: string,
    actorUserId: string,
    actorRole: UserRole,
  ): Promise<SessionSummaryDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        exercises: { orderBy: { sortOrder: 'asc' } },
        sets: true,
      },
    });
    if (!session) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session not found', 404);
    }

    if (session.status === SessionStatus.abandoned) {
      throw new AppException(ErrorCode.SESSION_ABANDONED, 'Session was abandoned', 409);
    }

    if (session.status === SessionStatus.completed) {
      return this.buildSummaryForSession(sessionId, session.clientProfileId, session);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(session.clientProfileId, actorUserId);

    if (session.status !== SessionStatus.active) {
      throw new AppException(ErrorCode.WORKOUT_STATUS_CONFLICT, 'Session is not active', 409);
    }

    const completedAt = new Date();
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.completed,
        completedAt,
      },
    });

    await this.workoutsService.markAttended(session.workoutId);
    await this.clientsLockService.release(session.clientProfileId, actorUserId, actorRole, false);

    const refreshed = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        exercises: { orderBy: { sortOrder: 'asc' } },
        sets: true,
      },
    });
    if (!refreshed) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session not found', 404);
    }

    return this.buildSummaryForSession(sessionId, refreshed.clientProfileId, refreshed);
  }

  /** Removes a logged set while the session is active (AD-15 terminal immutability). */
  async deleteSet(sessionId: string, setId: string, actorUserId: string): Promise<void> {
    const session = await this.loadSessionForMutation(sessionId, actorUserId);
    this.assertSessionActiveForMutation(session);

    const existing = await this.prisma.set.findUnique({ where: { id: setId } });
    if (!existing || existing.sessionId !== sessionId) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Set not found', 404);
    }

    await this.prisma.set.delete({ where: { id: setId } });
  }

  private async loadSessionForMutation(sessionId: string, actorUserId: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session not found', 404);
    }
    await this.clientsLockService.assertActorHoldsLiveLock(session.clientProfileId, actorUserId);
    return session;
  }

  private async resolveModifierIdForAttach(
    modifierId: string | null,
  ): Promise<string | null> {
    if (modifierId === null) {
      return null;
    }
    const row = await this.prisma.setModifier.findUnique({ where: { id: modifierId } });
    if (!row || row.archivedAt) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Set modifier not available', 400);
    }
    return row.id;
  }

  private assertSessionActiveForMutation(session: Session): void {
    if (session.status === SessionStatus.abandoned) {
      throw new AppException(ErrorCode.SESSION_ABANDONED, 'Session was abandoned', 409);
    }
    if (session.status !== SessionStatus.active) {
      throw new AppException(ErrorCode.WORKOUT_STATUS_CONFLICT, 'Session is not active', 409);
    }
  }

  private async buildSummaryForSession(
    sessionId: string,
    clientProfileId: string,
    session: {
      exercises: Array<{
        id: string;
        exerciseId: string;
        sortOrder: number;
        nameSnapshot: string;
      }>;
      sets: Array<{
        sessionExerciseId: string;
        weightKg: Prisma.Decimal | null;
        reps: number | null;
      }>;
    },
  ): Promise<SessionSummaryDto> {
    const priorCompletedSessions = await this.prisma.session.findMany({
      where: {
        clientProfileId,
        status: SessionStatus.completed,
        id: { not: sessionId },
      },
      orderBy: { completedAt: 'desc' },
      include: {
        exercises: true,
        sets: true,
      },
    });

    return buildSessionSummary({
      sessionId,
      exercises: session.exercises,
      sets: session.sets,
      priorCompletedSessions,
    });
  }
}
