import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TemplateExerciseInputDto } from './template-exercise.dto';

export class CreateWorkoutTemplateRequestDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(128)
  name!: string;

  @ApiProperty({ type: String, minLength: 1, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  type!: string;

  @ApiPropertyOptional({ type: String, maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  microcycleWeeks?: number | null;

  @ApiProperty({ type: () => TemplateExerciseInputDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateExerciseInputDto)
  exercises!: TemplateExerciseInputDto[];
}
