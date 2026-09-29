import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientMacroProgressSummaryDto } from '../../client-macro-progress/dto/client-macro-progress-summary.dto';
import { ClientLockStatusDto } from '../../clients-lock/dto/client-lock-status.dto';
import { ClientNextWorkoutDto } from './client-next-workout.dto';

export class ClientProfileDto {
  @ApiProperty({ type: String, example: 'clxyz123' })
  id!: string;

  @ApiProperty({ type: String, example: 'Иван Пуловой' })
  displayName!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'Привязка к User после регистрации по инвайту (Story 2.2)',
  })
  userId!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  deactivatedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({
    type: () => ClientLockStatusDto,
    nullable: true,
    required: false,
    description: 'Live lock held by another trainer; null when free or expired',
  })
  lockStatus?: ClientLockStatusDto | null;

  @ApiPropertyOptional({
    type: () => ClientMacroProgressSummaryDto,
    nullable: true,
    description: 'Macrocycle stage pointer when assigned (Story 3.4)',
  })
  macroProgress?: ClientMacroProgressSummaryDto | null;

  @ApiPropertyOptional({
    type: () => ClientNextWorkoutDto,
    nullable: true,
    description: 'Earliest pending workout for pool row meta (Story 4.4)',
  })
  nextWorkout?: ClientNextWorkoutDto | null;
}
