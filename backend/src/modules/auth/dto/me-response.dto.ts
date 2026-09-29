import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class MeResponseDto {
  @ApiProperty({ type: String, example: 'cluser123' })
  id!: string;

  @ApiProperty({ type: String, example: 'adminuser' })
  login!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role!: UserRole;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Linked client profile id for CLIENT role',
  })
  clientProfileId!: string | null;
}
