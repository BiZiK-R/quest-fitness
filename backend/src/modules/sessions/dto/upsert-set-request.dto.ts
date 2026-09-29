import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertSetRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  sessionExerciseId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rpe?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Attach palette modifier; null clears' })
  @IsOptional()
  @IsString()
  modifierId?: string | null;
}
