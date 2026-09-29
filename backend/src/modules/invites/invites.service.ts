import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { UserRole } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { normalizePhoneToE164 } from '../../shared/phone/normalize-phone-e164';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SessionService, SessionWithUser } from '../auth/session.service';
import { InviteRegisterRequestDto } from './dto/invite-register-request.dto';
import { InvitePreviewDto } from './dto/invite-preview.dto';
import { hashInviteToken } from './invite-token.util';
import {
  formatInviteExpiryLabel,
  getGymTimezone,
} from '../../shared/timezone/gym-timezone';
import { ActiveInviteStatusDto } from './dto/active-invite-status.dto';
import { IssueInviteResponseDto } from './dto/issue-invite-response.dto';
import { ClientsLockService } from '../clients-lock/clients-lock.service';

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
};

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly clientsLockService: ClientsLockService,
  ) {}

  async issue(
    clientProfileId: string,
    issuedByUserId: string,
  ): Promise<IssueInviteResponseDto> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientProfileId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }

    await this.clientsLockService.assertActorHoldsLiveLock(clientProfileId, issuedByUserId);

    const now = new Date();
    await this.prisma.invite.updateMany({
      where: {
        clientProfileId,
        revokedAt: null,
        consumedAt: null,
      },
      data: { revokedAt: now },
    });

    const token = generateOpaqueToken();
    const tokenHash = hashInviteToken(token);
    const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);

    await this.prisma.invite.create({
      data: {
        clientProfileId,
        issuedByUserId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      inviteUrl: `/invite/${token}`,
      token,
      expiresAt: expiresAt.toISOString(),
      expiresAtLabel: formatInviteExpiryLabel(expiresAt, getGymTimezone()),
    };
  }

  async getActiveStatus(clientProfileId: string): Promise<ActiveInviteStatusDto> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientProfileId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }

    const now = new Date();
    const active = await this.prisma.invite.findFirst({
      where: {
        clientProfileId,
        revokedAt: null,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) {
      return { hasActive: false, expiresAt: null, expiresAtLabel: null };
    }

    return {
      hasActive: true,
      expiresAt: active.expiresAt.toISOString(),
      expiresAtLabel: formatInviteExpiryLabel(active.expiresAt, getGymTimezone()),
    };
  }

  /**
   * Публичная регистрация клиента по инвайту (AD-5: одноразовый consume в транзакции).
   */
  async registerByToken(
    token: string,
    body: InviteRegisterRequestDto,
  ): Promise<SessionWithUser> {
    const phoneE164 = normalizePhoneToE164(body.phone);
    if (!phoneE164) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Validation failed', 400, {
        phone: ['Invalid phone number'],
      });
    }

    const loginNormalized = body.login;
    const tokenHash = hashInviteToken(token);
    const now = new Date();

    const userId = await this.prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({
        where: { tokenHash },
      });

      if (!invite || invite.revokedAt) {
        throw new AppException(ErrorCode.INVITE_EXPIRED, 'Invite expired or invalid', 409);
      }
      if (invite.consumedAt) {
        throw new AppException(
          ErrorCode.INVITE_ALREADY_CONSUMED,
          'Invite already consumed',
          409,
        );
      }
      if (invite.expiresAt.getTime() < now.getTime()) {
        throw new AppException(ErrorCode.INVITE_EXPIRED, 'Invite expired or invalid', 409);
      }

      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ login: loginNormalized }, { phoneE164 }],
        },
      });
      if (existingUser) {
        const details: Record<string, string[]> = {};
        if (existingUser.login === loginNormalized) {
          details.login = ['Login already taken'];
        }
        if (existingUser.phoneE164 === phoneE164) {
          details.phone = ['Phone already registered'];
        }
        throw new AppException(
          ErrorCode.VALIDATION_FAILED,
          'Validation failed',
          400,
          details,
        );
      }

      const passwordHash = await argon2.hash(body.password, ARGON2_OPTIONS);

      const user = await tx.user.create({
        data: {
          login: loginNormalized,
          phoneE164,
          passwordHash,
          role: UserRole.CLIENT,
        },
      });

      await tx.clientProfile.update({
        where: { id: invite.clientProfileId },
        data: {
          userId: user.id,
          displayName: body.name,
        },
      });

      const consumed = await tx.invite.updateMany({
        where: {
          id: invite.id,
          consumedAt: null,
          revokedAt: null,
        },
        data: { consumedAt: now },
      });
      if (consumed.count === 0) {
        throw new AppException(
          ErrorCode.INVITE_ALREADY_CONSUMED,
          'Invite already consumed',
          409,
        );
      }

      return user.id;
    });

    return this.sessionService.createSession(userId);
  }

  /** Краткий preview для лендинга регистрации. */
  async getInvitePreview(token: string): Promise<InvitePreviewDto> {
    const tokenHash = hashInviteToken(token);
    const now = new Date();
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash },
    });
    const valid =
      !!invite &&
      !invite.revokedAt &&
      !invite.consumedAt &&
      invite.expiresAt.getTime() >= now.getTime();
    return { valid };
  }
}
