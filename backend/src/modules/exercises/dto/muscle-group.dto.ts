import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MuscleGroupDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String, example: 'Грудь' })
  name!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  sortOrder!: number | null;
}

export class MuscleGroupListResponseDto {
  @ApiProperty({ type: () => MuscleGroupDto, isArray: true })
  muscleGroups!: MuscleGroupDto[];
}
