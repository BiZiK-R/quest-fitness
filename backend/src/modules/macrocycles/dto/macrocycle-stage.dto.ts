import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MacrocycleStageDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  templateId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  templateName!: string | null;

  @ApiProperty({ type: Number })
  sortOrder!: number;
}

export class MacrocycleStageInputDto {
  @ApiPropertyOptional({ type: String })
  id?: string;

  @ApiProperty({ type: String })
  templateId!: string;

  @ApiProperty({ type: Number })
  sortOrder!: number;
}
