import { Injectable } from '@nestjs/common';
import { WorkoutStatus } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { AssignWorkoutRequestDto } from './dto/assign-workout-request.dto';
import { RescheduleWorkoutRequestDto } from './dto/reschedule-workout-request.dto';
import { WorkoutDto } from './dto/workout.dto';
import {
  assignWorkoutIdempotencyScope,
  cancelWorkoutIdempotencyScope,
  skipWorkoutIdempotencyScope,
} from './workout-idempotency.constants';
import { WorkoutIdempotencyService } from './workout-idempotency.service';
import { toWorkoutDto } from './workout.mapper';

const workoutWithTemplateInclude = {
  template: { select: { name: true } },
};

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsLockService: ClientsLockService,
    private readonly idempotencyService: WorkoutIdempotencyService,
  ) {}

  async assign(
    clientId: string,
    actorUserId: string,
    idempotencyKey: string | undefined,
    body: AssignWorkoutRequestDto,
  ): Promise<WorkoutDto> {
    const trimmedKey = idempotencyKey?.trim();
    if (!trimmedKey) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Idempotency-Key header is required',
        400,
      );
    }

    const scope = assignWorkoutIdempotencyScope(clientId);
    const replay = await this.idempotencyService.findReplay(scope, trimmedKey);
    if (replay) {
      return replay.responseBody as WorkoutDto;
    }

    await this.clientsLockService.assertActorHoldsLiveLock(clientId, actorUserId);
    await this.ensureClientExists(clientId);

    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Invalid scheduledAt', 400);
    }

    const { templateId, sourceStageId } = await this.resolveTemplate(clientId, body.templateId);

    const row = await this.prisma.workout.create({
      data: {
        clientProfileId: clientId,
        scheduledAt,
        status: WorkoutStatus.pending,
        templateId,
        sourceStageId,
        createdByUserId: actorUserId,
      },
      include: workoutWithTemplateInclude,
    });

    const dto = toWorkoutDto(row);
    await this.idempotencyService.store(scope, trimmedKey, actorUserId, 201, dto);
    return dto;
  }

  async skip(
    workoutId: string,
    actorUserId: string,
    idempotencyKey: string | undefined,
  ): Promise<WorkoutDto> {
    return this.transitionPendingWorkout(
      workoutId,
      actorUserId,
      idempotencyKey,
      skipWorkoutIdempotencyScope(workoutId),
      WorkoutStatus.skipped,
    );
  }

  async cancel(
    workoutId: string,
    actorUserId: string,
    idempotencyKey: string | undefined,
  ): Promise<WorkoutDto> {
    return this.transitionPendingWorkout(
      workoutId,
      actorUserId,
      idempotencyKey,
      cancelWorkoutIdempotencyScope(workoutId),
      WorkoutStatus.cancelled,
    );
  }

  async reschedule(
    workoutId: string,
    actorUserId: string,
    body: RescheduleWorkoutRequestDto,
  ): Promise<WorkoutDto> {
    const existing = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: workoutWithTemplateInclude,
    });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout not found', 404);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(
      existing.clientProfileId,
      actorUserId,
    );

    if (existing.status !== WorkoutStatus.pending) {
      throw new AppException(
        ErrorCode.WORKOUT_STATUS_CONFLICT,
        'Workout status transition not allowed',
        409,
      );
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Invalid scheduledAt', 400);
    }

    const row = await this.prisma.workout.update({
      where: { id: workoutId },
      data: { scheduledAt },
      include: workoutWithTemplateInclude,
    });

    return toWorkoutDto(row);
  }

  async listForClient(clientId: string): Promise<WorkoutDto[]> {
    await this.ensureClientExists(clientId);
    const rows = await this.prisma.workout.findMany({
      where: { clientProfileId: clientId },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
      include: workoutWithTemplateInclude,
    });
    return rows.map(toWorkoutDto);
  }

  private async resolveTemplate(
    clientId: string,
    explicitTemplateId: string | undefined,
  ): Promise<{ templateId: string; sourceStageId: string | null }> {
    if (explicitTemplateId !== undefined) {
      const template = await this.prisma.workoutTemplate.findUnique({
        where: { id: explicitTemplateId },
      });
      if (!template) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Workout template not found', 404);
      }
      return { templateId: explicitTemplateId, sourceStageId: null };
    }

    const progress = await this.prisma.clientMacroProgress.findUnique({
      where: { clientProfileId: clientId },
      include: { currentStage: true },
    });
    if (!progress || progress.currentStageId === null || !progress.currentStage) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Cannot resolve template from macro stage: assign macrocycle or pass templateId (stages exhausted)',
        400,
      );
    }

    return {
      templateId: progress.currentStage.templateId,
      sourceStageId: progress.currentStage.id,
    };
  }

  private async transitionPendingWorkout(
    workoutId: string,
    actorUserId: string,
    idempotencyKey: string | undefined,
    scope: string,
    targetStatus: typeof WorkoutStatus.skipped | typeof WorkoutStatus.cancelled,
  ): Promise<WorkoutDto> {
    const trimmedKey = idempotencyKey?.trim();
    if (!trimmedKey) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Idempotency-Key header is required',
        400,
      );
    }

    const replay = await this.idempotencyService.findReplay(scope, trimmedKey);
    if (replay) {
      return replay.responseBody as WorkoutDto;
    }

    const existing = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: workoutWithTemplateInclude,
    });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout not found', 404);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(
      existing.clientProfileId,
      actorUserId,
    );

    if (existing.status !== WorkoutStatus.pending) {
      throw new AppException(
        ErrorCode.WORKOUT_STATUS_CONFLICT,
        'Workout status transition not allowed',
        409,
      );
    }

    const row = await this.prisma.workout.update({
      where: { id: workoutId },
      data: { status: targetStatus },
      include: workoutWithTemplateInclude,
    });

    const dto = toWorkoutDto(row);
    await this.idempotencyService.store(scope, trimmedKey, actorUserId, 200, dto);
    return dto;
  }

  private async ensureClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }
  }
}
