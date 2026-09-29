import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class DiaryEntryDto {
  @ApiProperty({ type: String })
  sessionId!: string;

  @ApiProperty({ enum: SessionStatus })
  status!: SessionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  abandonedAt!: string | null;

  @ApiProperty({ type: String })
  authorTrainerId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  authorDisplayName!: string | null;

  @ApiProperty({ type: String })
  workoutId!: string;

  @ApiProperty({ type: Number })
  setCount!: number;

  @ApiProperty({ type: Number })
  totalTonnageKg!: number;

  @ApiProperty({ type: Boolean, description: 'True when session was abandoned (AD-15)' })
  incomplete!: boolean;
}
