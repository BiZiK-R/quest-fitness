import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateExerciseDto } from './template-exercise.dto';

export class WorkoutTemplateDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String, example: 'strength' })
  type!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  microcycleWeeks!: number | null;

  @ApiProperty({ type: Number })
  version!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt!: string | null;

  @ApiProperty({ type: () => TemplateExerciseDto, isArray: true })
  exercises!: TemplateExerciseDto[];
}

export class WorkoutTemplateListResponseDto {
  @ApiProperty({ type: () => WorkoutTemplateDto, isArray: true })
  templates!: WorkoutTemplateDto[];
}
