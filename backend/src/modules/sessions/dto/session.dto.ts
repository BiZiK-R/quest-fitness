import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { SessionExerciseDto } from './session-exercise.dto';

export class SessionDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  workoutId!: string;

  @ApiProperty({ type: String })
  clientProfileId!: string;

  @ApiProperty({ type: String })
  authorTrainerId!: string;

  @ApiProperty({ enum: SessionStatus })
  status!: SessionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  abandonedAt!: string | null;

  @ApiProperty({
    type: Number,
    description: 'Planned session length in minutes copied from template at start (AD-8)',
  })
  plannedDurationMinutes!: number;

  @ApiProperty({ type: () => SessionExerciseDto, isArray: true })
  exercises!: SessionExerciseDto[];
}
