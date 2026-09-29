import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowed?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const role = request.user?.role;
    if (!role || !allowed.includes(role)) {
      throw new AppException(
        ErrorCode.FORBIDDEN_ROLE,
        'Insufficient role for this action',
        403,
      );
    }

    return true;
  }
}
