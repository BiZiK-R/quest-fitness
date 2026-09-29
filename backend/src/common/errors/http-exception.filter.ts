import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException, ErrorEnvelopeBody } from './app.exception';
import { ErrorCode } from './error-code.enum';

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionEnvelopeFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const envelope = this.toEnvelope(exception);
    response.status(envelope.status).json(envelope.body);
  }

  private toEnvelope(exception: unknown): {
    status: number;
    body: ErrorEnvelopeBody;
  } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.details !== undefined
              ? { details: exception.details }
              : {}),
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        typeof (response as { code: unknown }).code === 'string'
      ) {
        const payload = response as {
          code: ErrorCode;
          message: string;
          details?: unknown;
        };
        return {
          status,
          body: {
            error: {
              code: payload.code,
              message: payload.message,
              ...(payload.details !== undefined
                ? { details: payload.details }
                : {}),
            },
          },
        };
      }
      const code = this.httpStatusToCode(status);
      const message = this.extractMessage(exception);
      return {
        status,
        body: {
          error: { code, message },
        },
      };
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
    };
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message: unknown }).message;
      if (Array.isArray(message)) {
        return message.join('; ');
      }
      if (typeof message === 'string') {
        return message;
      }
    }
    return exception.message;
  }

  private httpStatusToCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN_ROLE;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
