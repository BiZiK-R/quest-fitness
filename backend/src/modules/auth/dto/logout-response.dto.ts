import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}
