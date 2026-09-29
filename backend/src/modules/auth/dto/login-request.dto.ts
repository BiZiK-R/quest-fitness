import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    type: String,
    example: 'adminuser',
    description: 'Логин (lowercase) или телефон E.164 / RU-формат',
    minLength: 3,
    maxLength: 32,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(32)
  login!: string;

  @ApiProperty({ type: String, example: 'SecretPass1!', minLength: 8, format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
