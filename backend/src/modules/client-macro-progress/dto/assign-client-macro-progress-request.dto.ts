import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignClientMacroProgressRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  macrocycleId!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentStageId?: string;
}
