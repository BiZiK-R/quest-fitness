import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { SessionExerciseDto } from '../../sessions/dto/session-exercise.dto';
import { SetDto } from '../../sessions/dto/set.dto';

export class DiarySessionDetailDto {
  @ApiProperty({ type: String })
  sessionId!: string;

  @ApiProperty({ type: String })
  workoutId!: string;

  @ApiProperty({ type: String })
  clientProfileId!: string;

  @ApiProperty({ type: String })
  authorTrainerId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  authorDisplayName!: string | null;

  @ApiProperty({ enum: SessionStatus })
  status!: SessionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  abandonedAt!: string | null;

  @ApiProperty({ type: Boolean })
  incomplete!: boolean;

  @ApiProperty({ type: Number })
  totalTonnageKg!: number;

  @ApiProperty({ type: () => SessionExerciseDto, isArray: true })
  exercises!: SessionExerciseDto[];

  @ApiProperty({ type: () => SetDto, isArray: true })
  sets!: SetDto[];
}
