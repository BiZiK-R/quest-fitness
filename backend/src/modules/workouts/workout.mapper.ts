import { WorkoutStatus } from '@prisma/client';
import { WorkoutDto } from './dto/workout.dto';
import { computeWorkoutIsOverdue } from './workout-overdue.util';

type WorkoutRow = {
  id: string;
  clientProfileId: string;
  scheduledAt: Date;
  status: WorkoutStatus;
  templateId: string | null;
  sourceStageId: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  template?: { name: string } | null;
};

export type ToWorkoutDtoOptions = {
  /** Test hook / deterministic overdue (AD-17). */
  now?: Date;
};

/** Maps Prisma workout row to API DTO. */
export function toWorkoutDto(row: WorkoutRow, options?: ToWorkoutDtoOptions): WorkoutDto {
  const now = options?.now ?? new Date();
  return {
    id: row.id,
    clientProfileId: row.clientProfileId,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    isOverdue: computeWorkoutIsOverdue(row.status, row.scheduledAt, now),
    templateId: row.templateId,
    templateName: row.template?.name ?? null,
    sourceStageId: row.sourceStageId,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
