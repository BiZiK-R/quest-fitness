import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class MeResponseDto {
  @ApiProperty({ type: String, example: 'cluser123' })
  id!: string;

  @ApiProperty({ type: String, example: 'adminuser' })
  login!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role!: UserRole;
}
