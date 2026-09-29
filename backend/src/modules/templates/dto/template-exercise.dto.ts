import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TemplateExerciseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  exerciseId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  exerciseName!: string | null;

  @ApiProperty({ type: Number })
  sortOrder!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedSets!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedReps!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plannedWeightKg!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  supersetGroupId!: string | null;
}

export class TemplateExerciseInputDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  plannedSets?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  plannedReps?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedWeightKg?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  supersetGroupId?: string | null;
}
