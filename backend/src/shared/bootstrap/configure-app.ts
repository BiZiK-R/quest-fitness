import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionEnvelopeFilter } from '../../common/errors/http-exception.filter';
import { validationExceptionFactory } from '../../common/errors/validation-exception.factory';

/**
 * Общая настройка HTTP-приложения (main + тесты).
 */
export function configureApp(app: INestApplication): void {
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionEnvelopeFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
