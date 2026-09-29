import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientMacroProgressSummaryDto {
  @ApiProperty({ type: String })
  macrocycleId!: string;

  @ApiProperty({ type: String, nullable: true })
  currentStageId!: string | null;

  @ApiProperty({
    type: Boolean,
    description: 'True when pointer is null (with progress) or on the last stage by sortOrder',
  })
  stagesExhausted!: boolean;

  @ApiPropertyOptional({ type: String })
  macrocycleName?: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  currentStageSortOrder?: number | null;

  @ApiPropertyOptional({ type: Number })
  stageCount?: number;
}
