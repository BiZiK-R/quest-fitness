import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionExerciseSummaryDto {
  @ApiProperty({ type: String })
  exerciseId!: string;

  @ApiProperty({ type: String })
  nameSnapshot!: string;

  @ApiProperty({ type: Number })
  setCount!: number;

  @ApiProperty({ type: Number })
  tonnageKg!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Tonnage growth vs last completed session for this exercise; null on first time',
  })
  growthPercent!: number | null;

  @ApiProperty({
    type: Boolean,
    description: 'True when client has no prior completed session for this exerciseId',
  })
  firstTime!: boolean;
}
