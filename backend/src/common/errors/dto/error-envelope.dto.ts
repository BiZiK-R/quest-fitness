import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../error-code.enum';

export class ErrorBodyDto {
  @ApiProperty({ enum: ErrorCode, enumName: 'ErrorCode' })
  code!: ErrorCode;

  @ApiProperty({ type: String })
  message!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details?: Record<string, unknown>;
}

export class ErrorEnvelopeDto {
  @ApiProperty({ type: () => ErrorBodyDto })
  error!: ErrorBodyDto;
}
