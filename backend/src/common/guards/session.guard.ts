import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUIRE_SESSION_KEY } from '../decorators/require-session.decorator';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code.enum';
import { SessionService } from '../../modules/auth/session.service';
import { SESSION_COOKIE_NAME } from '../../modules/auth/auth.constants';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireSession = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SESSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireSession) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!sessionId) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        'Authentication required',
        401,
      );
    }

    const session = await this.sessionService.findValidSession(sessionId);
    if (!session) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        'Authentication required',
        401,
      );
    }

    request.session = session;
    request.user = session.user;
    return true;
  }
}
