import { ApiProperty } from '@nestjs/swagger';
import { ClientProfileDto } from './client-profile.dto';

export class ClientListResponseDto {
  @ApiProperty({ type: [ClientProfileDto] })
  clients!: ClientProfileDto[];
}
