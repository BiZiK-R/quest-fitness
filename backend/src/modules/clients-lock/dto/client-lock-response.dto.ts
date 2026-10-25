import { ApiProperty } from '@nestjs/swagger';

export class ClientLockResponseDto {
  @ApiProperty({ type: String })
  holderTrainerId!: string;

  /** Имя тренера-держателя для UI («Клиента ведёт …»). */
  @ApiProperty({ type: String })
  holderDisplayName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;
}
