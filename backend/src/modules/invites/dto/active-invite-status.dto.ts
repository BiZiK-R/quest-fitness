import { ApiProperty } from '@nestjs/swagger';

export class ActiveInviteStatusDto {
  @ApiProperty({ type: Boolean })
  hasActive!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  expiresAt!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
  })
  expiresAtLabel!: string | null;
}
