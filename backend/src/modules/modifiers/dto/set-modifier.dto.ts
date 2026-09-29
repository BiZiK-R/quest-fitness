import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetModifierDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String, description: 'Palette token id (e.g. mod-amber)' })
  colorToken!: string;

  @ApiProperty({ type: Boolean })
  isPreset!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class SetModifierListResponseDto {
  @ApiProperty({ type: [SetModifierDto] })
  modifiers!: SetModifierDto[];
}
