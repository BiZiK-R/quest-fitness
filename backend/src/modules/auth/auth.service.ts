import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SessionService, SessionWithUser } from './session.service';

const STAFF_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.ADMIN,
  UserRole.TRAINER,
]);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Вход по логину и паролю для ADMIN/TRAINER (Story 1.2).
   */
  async login(login: string, password: string): Promise<SessionWithUser> {
    const normalizedLogin = login.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { login: normalizedLogin },
    });

    if (!user) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        'Invalid login or password',
        401,
      );
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        'Invalid login or password',
        401,
      );
    }

    if (!STAFF_ROLES.has(user.role)) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        'Invalid login or password',
        401,
      );
    }

    return this.sessionService.createSession(user.id);
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.invalidateSession(sessionId);
  }
}
