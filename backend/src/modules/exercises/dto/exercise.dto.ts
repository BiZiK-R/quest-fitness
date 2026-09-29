import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExerciseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String, example: 'Жим лёжа' })
  name!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt!: string | null;

  @ApiProperty({
    type: Boolean,
    description:
      'true, если у упражнения нет ни основной, ни дополнительных мышечных групп',
  })
  missingMuscleGroupsWarning!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  primaryMuscleGroupId!: string | null;

  @ApiProperty({ type: String, isArray: true })
  secondaryMuscleGroupIds!: string[];
}

export class ExerciseListResponseDto {
  @ApiProperty({ type: () => ExerciseDto, isArray: true })
  exercises!: ExerciseDto[];
}
