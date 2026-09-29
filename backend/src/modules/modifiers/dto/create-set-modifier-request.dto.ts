import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSetModifierRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;

  @ApiProperty({ type: String, description: 'Palette token id' })
  @IsString()
  @IsNotEmpty()
  colorToken!: string;
}
