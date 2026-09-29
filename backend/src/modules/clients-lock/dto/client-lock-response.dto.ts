import { ApiProperty } from '@nestjs/swagger';

export class ClientLockResponseDto {
  @ApiProperty({ type: String })
  holderTrainerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;
}
