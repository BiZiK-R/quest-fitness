import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  formatInviteExpiryLabel,
  getGymTimezone,
} from '../../shared/timezone/gym-timezone';
import { ActiveInviteStatusDto } from './dto/active-invite-status.dto';
import { IssueInviteResponseDto } from './dto/issue-invite-response.dto';

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
