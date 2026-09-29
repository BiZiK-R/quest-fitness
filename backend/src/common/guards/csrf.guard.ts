import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code.enum';
import { CSRF_HEADER_NAME, SESSION_COOKIE_NAME } from '../../modules/auth/auth.constants';
import { SessionService } from '../../modules/auth/session.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;
    if (!sessionId) {
      return true;
    }

    const session = await this.sessionService.findValidSession(sessionId);
    if (!session) {
      return true;
    }

    const headerToken = request.headers[CSRF_HEADER_NAME];
    const token =
      typeof headerToken === 'string'
        ? headerToken
        : Array.isArray(headerToken)
          ? headerToken[0]
          : undefined;

    if (!token || token !== session.csrfToken) {
      throw new AppException(
        ErrorCode.CSRF_INVALID,
        'CSRF token invalid or missing',
        403,
      );
    }

    return true;
  }
}
