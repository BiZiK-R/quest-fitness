import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleWorkoutRequestDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  scheduledAt!: string;
}
