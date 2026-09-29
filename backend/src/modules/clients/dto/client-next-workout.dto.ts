import { ApiProperty } from '@nestjs/swagger';
import { WorkoutStatus } from '@prisma/client';

/** Earliest pending workout summary on pool list rows (Story 4.4). */
export class ClientNextWorkoutDto {
  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty({ enum: WorkoutStatus })
  status!: WorkoutStatus;

  @ApiProperty({ type: Boolean })
  isOverdue!: boolean;
}
