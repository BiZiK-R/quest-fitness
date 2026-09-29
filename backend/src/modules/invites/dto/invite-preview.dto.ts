import { ApiProperty } from '@nestjs/swagger';

export class InvitePreviewDto {
  @ApiProperty({ type: Boolean })
  valid!: boolean;
}
