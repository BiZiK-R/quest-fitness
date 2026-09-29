import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MacrocycleStageDto } from './macrocycle-stage.dto';

export class MacrocycleDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  periodicityNote!: string | null;

  @ApiProperty({ type: () => MacrocycleStageDto, isArray: true })
  stages!: MacrocycleStageDto[];
}

export class MacrocycleListResponseDto {
  @ApiProperty({ type: () => MacrocycleDto, isArray: true })
  macrocycles!: MacrocycleDto[];
}
