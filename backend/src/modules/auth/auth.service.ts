import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { normalizePhoneToE164 } from '../../shared/phone/normalize-phone-e164';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SessionService, SessionWithUser } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Вход по логину или телефону (E.164) и паролю — все роли, включая CLIENT.
   */
  async login(identifier: string, password: string): Promise<SessionWithUser> {
    const user = await this.findUserByLoginOrPhone(identifier);
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

    return this.sessionService.createSession(user.id);
  }

  private async findUserByLoginOrPhone(identifier: string) {
    const trimmed = identifier.trim();
    const loginNormalized = trimmed.toLowerCase();
    const phoneE164 = normalizePhoneToE164(trimmed);

    const or: Prisma.UserWhereInput[] = [{ login: loginNormalized }];
    if (phoneE164) {
      or.push({ phoneE164 });
    }

    return this.prisma.user.findFirst({
      where: { OR: or },
    });
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.invalidateSession(sessionId);
  }
}
