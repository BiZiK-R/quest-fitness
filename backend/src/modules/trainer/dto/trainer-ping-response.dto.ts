import { ApiProperty } from '@nestjs/swagger';

export class TrainerPingResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: true;
}
