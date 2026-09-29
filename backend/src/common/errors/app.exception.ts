import { HttpException } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export type ErrorEnvelopeBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};

/**
 * Доменное исключение с кодом из ErrorCode для error envelope.
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message, statusCode);
  }
}
