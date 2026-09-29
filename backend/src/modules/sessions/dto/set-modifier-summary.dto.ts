import { ApiProperty } from '@nestjs/swagger';

export class SetModifierSummaryDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  colorToken!: string;
}
