import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    type: String,
    description: 'CSRF token for mutating requests (header x-csrf-token)',
  })
  csrfToken!: string;
}
