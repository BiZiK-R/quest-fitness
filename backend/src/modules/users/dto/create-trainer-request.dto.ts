import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTrainerRequestDto {
  @ApiProperty({ type: String, example: 'newtrainer', minLength: 3, maxLength: 32 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
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
