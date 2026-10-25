import { ApiProperty } from '@nestjs/swagger';

/** Live lock summary for read-only client views (GET never acquires). */
export class ClientLockStatusDto {
  @ApiProperty({ type: String })
  holderTrainerId!: string;

  /** Имя тренера-держателя для UI («Клиента ведёт …»). */
  @ApiProperty({ type: String })
  holderDisplayName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;
}
