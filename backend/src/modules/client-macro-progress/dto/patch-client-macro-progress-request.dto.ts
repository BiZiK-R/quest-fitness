import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PatchClientMacroProgressRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentStageId!: string;
}
