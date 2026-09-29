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
import { MacrocycleStageInputDto } from './macrocycle-stage.dto';

export class UpdateMacrocycleStageInputDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpdateMacrocycleRequestDto {
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

  @ApiProperty({ type: () => UpdateMacrocycleStageInputDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMacrocycleStageInputDto)
  stages!: UpdateMacrocycleStageInputDto[];
}
