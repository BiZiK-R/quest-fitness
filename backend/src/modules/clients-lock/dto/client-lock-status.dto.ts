import { ApiProperty } from '@nestjs/swagger';

/** Live lock summary for read-only client views (GET never acquires). */
export class ClientLockStatusDto {
  @ApiProperty({ type: String })
  holderTrainerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;
}
