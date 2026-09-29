import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutStatus } from '@prisma/client';

export class WorkoutOverviewItemDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty({ enum: WorkoutStatus })
  status!: WorkoutStatus;

  @ApiProperty({
    type: Boolean,
    description: 'Pending and gym-local day before today (AD-17)',
  })
  isOverdue!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  templateName!: string | null;
}

export class ClientWorkoutsOverviewDto {
  @ApiProperty({
    type: String,
    description: 'Current gym-local month as YYYY-MM (AD-17, do not derive on FE)',
    example: '2026-03',
  })
  monthKey!: string;

  @ApiProperty({
    type: String,
    description: 'Human-readable gym-local month label (ru-RU)',
  })
  monthLabel!: string;

  @ApiProperty({
    type: Number,
    description: 'Workouts scheduled in current gym-local month (non-cancelled)',
  })
  workoutsThisMonth!: number;

  @ApiProperty({ type: () => WorkoutOverviewItemDto, isArray: true })
  upcoming!: WorkoutOverviewItemDto[];

  @ApiPropertyOptional({ type: () => WorkoutOverviewItemDto, nullable: true })
  nextScheduled!: WorkoutOverviewItemDto | null;

  @ApiProperty({
    type: Boolean,
    description: 'True when the client has no workouts at all',
  })
  isEmpty!: boolean;
}
