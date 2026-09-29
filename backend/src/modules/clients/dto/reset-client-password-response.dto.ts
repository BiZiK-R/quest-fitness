import { ApiProperty } from '@nestjs/swagger';

export class ResetClientPasswordResponseDto {
  @ApiProperty({
    type: String,
    description: 'Временный пароль — показывается один раз (Story 2.6)',
    minLength: 8,
  })
  temporaryPassword!: string;
}
