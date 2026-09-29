import { WorkoutStatus } from '@prisma/client';
import { WorkoutDto } from './dto/workout.dto';

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

/** Maps Prisma workout row to API DTO. */
export function toWorkoutDto(row: WorkoutRow): WorkoutDto {
  return {
    id: row.id,
    clientProfileId: row.clientProfileId,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    templateId: row.templateId,
    templateName: row.template?.name ?? null,
    sourceStageId: row.sourceStageId,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
