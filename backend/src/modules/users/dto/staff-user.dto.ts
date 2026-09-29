import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class StaffUserDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  login!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}
