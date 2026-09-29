import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOGIN_USERNAME_PATTERN } from '../../../shared/auth/login-username.pattern';

export class InviteRegisterRequestDto {
  @ApiProperty({ type: String, example: 'Иван Петров' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    type: String,
    example: '+79161234567',
    description: 'Телефон (E.164 или RU-формат)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    type: String,
    example: 'ivan_client',
    minLength: 3,
    maxLength: 32,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(LOGIN_USERNAME_PATTERN, {
    message: 'login must be 3–32 latin letters, digits, _ or -',
  })
  login!: string;

  @ApiProperty({ type: String, minLength: 8, format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
