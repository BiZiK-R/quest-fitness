import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SetModifierSummaryDto } from './set-modifier-summary.dto';

export class SetDto {
  @ApiProperty({ type: String, description: 'Client-generated set id (UUID)' })
  id!: string;

  @ApiProperty({ type: String })
  sessionId!: string;

  @ApiProperty({ type: String })
  sessionExerciseId!: string;

  @ApiProperty({ type: Number, description: 'Server-assigned order within session' })
  sequenceIndex!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  weightKg!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  reps!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  rpe!: number | null;

  @ApiPropertyOptional({ type: () => SetModifierSummaryDto, nullable: true })
  modifier!: SetModifierSummaryDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
