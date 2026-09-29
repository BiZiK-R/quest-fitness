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
export class MacrocycleStageCreateInputDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class CreateMacrocycleRequestDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({ type: String, maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  periodicityNote?: string | null;

  @ApiProperty({ type: () => MacrocycleStageCreateInputDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MacrocycleStageCreateInputDto)
  stages!: MacrocycleStageCreateInputDto[];
}
