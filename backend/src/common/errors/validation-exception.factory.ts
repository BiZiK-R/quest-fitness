import { BadRequestException, ValidationError } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

function flattenValidationErrors(
  errors: ValidationError[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    if (error.constraints) {
      result[error.property] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      Object.assign(result, flattenValidationErrors(error.children));
    }
  }

  return result;
}

/** Фабрика для ValidationPipe: envelope-friendly VALIDATION_FAILED. */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const details = flattenValidationErrors(errors);
  return new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Validation failed',
    details,
  });
}
