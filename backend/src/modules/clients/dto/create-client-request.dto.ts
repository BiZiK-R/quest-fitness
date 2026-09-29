import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClientRequestDto {
  @ApiProperty({
    type: String,
    example: 'Иван Пуловой',
    description: 'Отображаемое имя слота клиента в общем пуле',
    minLength: 1,
    maxLength: 128,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(128)
  displayName!: string;
}
