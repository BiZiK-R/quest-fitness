import { ApiProperty } from '@nestjs/swagger';
import { StaffUserDto } from './staff-user.dto';

export class StaffListResponseDto {
  @ApiProperty({ type: () => StaffUserDto, isArray: true })
  trainers!: StaffUserDto[];
}
