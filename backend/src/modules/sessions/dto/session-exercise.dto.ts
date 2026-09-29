import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionExerciseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  sessionId!: string;

  @ApiProperty({ type: String })
  exerciseId!: string;

  @ApiProperty({ type: Number })
  sortOrder!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedSets!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedReps!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedWeightKg!: number | null;

  @ApiProperty({ type: String, description: 'Exercise name frozen at session start (AD-7)' })
  nameSnapshot!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;
}
