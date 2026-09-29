import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutStatus } from '@prisma/client';

export class WorkoutDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  clientProfileId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty({ enum: WorkoutStatus })
  status!: WorkoutStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  templateId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  templateName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sourceStageId!: string | null;

  @ApiProperty({ type: String })
  createdByUserId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class WorkoutListResponseDto {
  @ApiProperty({ type: () => WorkoutDto, isArray: true })
  workouts!: WorkoutDto[];
}
