import { ApiProperty } from '@nestjs/swagger';

export class IssueInviteResponseDto {
  @ApiProperty({
    type: String,
    example: '/invite/abc123opaque',
    description: 'Относительный путь для SPA; origin добавляет FE',
  })
  inviteUrl!: string;

  @ApiProperty({
    type: String,
    description: 'Plain token — возвращается один раз при выдаче',
  })
  token!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({
    type: String,
    example: 'до 30 сентября 2026 г., 18:00',
    description: 'Отображение срока в GYM_TIMEZONE (AD-17)',
  })
  expiresAtLabel!: string;
}
