import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class AssignWorkoutRequestDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  templateId?: string;
}
