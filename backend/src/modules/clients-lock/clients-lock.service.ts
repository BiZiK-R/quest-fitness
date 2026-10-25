import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CLIENT_LOCK_IDLE_TTL_MS } from './client-lock.constants';
import { computeLockExpiresAt, isLockExpired } from './client-lock.util';
import { ClientLockStatusDto } from './dto/client-lock-status.dto';
import { ClientLockResponseDto } from './dto/client-lock-response.dto';

/** Держатель удалён быть не может (FK Restrict), но UI не должен получить пустую строку. */
export const FALLBACK_HOLDER_NAME = 'Тренер';

@Injectable()
export class ClientsLockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the actor holds a live lock before client mutations (AD-6).
   */
  async assertActorHoldsLiveLock(clientId: string, actorTrainerId: string): Promise<void> {
    const status = await this.getLiveLockStatus(clientId);
    if (!status || status.holderTrainerId !== actorTrainerId) {
      throw new AppException(ErrorCode.LOCK_REQUIRED, 'Client lock required', 409);
    }
  }

  /** Returns live lock summary or null when free / expired. */
  async getLiveLockStatus(clientId: string): Promise<ClientLockStatusDto | null> {
    const row = await this.prisma.clientLock.findUnique({
      where: { clientId },
    });
    if (!row || isLockExpired(row.lastActivityAt)) {
      return null;
    }
    return this.toStatusDto(row.holderTrainerId, row.lastActivityAt);
  }

  async acquire(clientId: string, holderTrainerId: string): Promise<ClientLockResponseDto> {
    await this.ensureClientExists(clientId);

    const now = new Date();
    const staleBefore = new Date(now.getTime() - CLIENT_LOCK_IDLE_TTL_MS);

    const claimed = await this.prisma.clientLock.updateMany({
      where: {
        clientId,
        OR: [
          { holderTrainerId },
          { lastActivityAt: { lt: staleBefore } },
        ],
      },
      data: {
        holderTrainerId,
        lastActivityAt: now,
      },
    });

    if (claimed.count > 0) {
      return this.toResponseDto(holderTrainerId, now);
    }

    const existing = await this.prisma.clientLock.findUnique({
      where: { clientId },
    });

    if (!existing) {
      try {
        await this.prisma.clientLock.create({
          data: {
            clientId,
            holderTrainerId,
            lastActivityAt: now,
          },
        });
        return this.toResponseDto(holderTrainerId, now);
      } catch {
        const raced = await this.prisma.clientLock.findUnique({
          where: { clientId },
        });
        if (
          raced &&
          !isLockExpired(raced.lastActivityAt, now) &&
          raced.holderTrainerId !== holderTrainerId
        ) {
          throw new AppException(ErrorCode.CLIENT_LOCKED, 'Client is locked by another trainer', 409, {
            holderTrainerId: raced.holderTrainerId,
            expiresAt: computeLockExpiresAt(raced.lastActivityAt).toISOString(),
          });
        }
        await this.prisma.clientLock.update({
          where: { clientId },
          data: { holderTrainerId, lastActivityAt: now },
        });
        return this.toResponseDto(holderTrainerId, now);
      }
    }

    if (
      !isLockExpired(existing.lastActivityAt, now) &&
      existing.holderTrainerId !== holderTrainerId
    ) {
      throw new AppException(ErrorCode.CLIENT_LOCKED, 'Client is locked by another trainer', 409, {
        holderTrainerId: existing.holderTrainerId,
        expiresAt: computeLockExpiresAt(existing.lastActivityAt).toISOString(),
      });
    }

    await this.prisma.clientLock.update({
      where: { clientId },
      data: { holderTrainerId, lastActivityAt: now },
    });
    return this.toResponseDto(holderTrainerId, now);
  }

  async heartbeat(clientId: string, holderTrainerId: string): Promise<ClientLockResponseDto> {
    await this.ensureClientExists(clientId);
    const row = await this.prisma.clientLock.findUnique({
      where: { clientId },
    });
    if (!row || isLockExpired(row.lastActivityAt) || row.holderTrainerId !== holderTrainerId) {
      throw new AppException(ErrorCode.LOCK_REQUIRED, 'Client lock required', 409);
    }

    const now = new Date();
    await this.prisma.clientLock.update({
      where: { clientId },
      data: { lastActivityAt: now },
    });
    return this.toResponseDto(holderTrainerId, now);
  }

  /**
   * Soft-release lock. When Session domain exists, abandon active session here (TODO).
   */
  async release(
    clientId: string,
    actorId: string,
    actorRole: UserRole,
    force: boolean,
  ): Promise<void> {
    await this.ensureClientExists(clientId);
    const row = await this.prisma.clientLock.findUnique({
      where: { clientId },
    });
    if (!row) {
      return;
    }

    const isHolder = row.holderTrainerId === actorId;
    const canForce = force && (isHolder || actorRole === UserRole.ADMIN);
    if (!isHolder && !canForce) {
      throw new AppException(ErrorCode.LOCK_REQUIRED, 'Client lock required', 409);
    }

    // TODO(Session): when activeSessionId is set, mark Session abandoned before delete.
    await this.prisma.clientLock.delete({ where: { clientId } });
  }

  private async ensureClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }
  }

  /**
   * Имена тренеров-держателей одним запросом (список Пула — без N+1).
   * У User нет отдельного displayName — показываем login.
   */
  async resolveHolderDisplayNames(holderTrainerIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(holderTrainerIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, login: true },
    });
    return new Map(users.map((user) => [user.id, user.login]));
  }

  private async toStatusDto(
    holderTrainerId: string,
    lastActivityAt: Date,
  ): Promise<ClientLockStatusDto> {
    const holder = await this.prisma.user.findUnique({
      where: { id: holderTrainerId },
      select: { login: true },
    });
    return {
      holderTrainerId,
      holderDisplayName: holder?.login ?? FALLBACK_HOLDER_NAME,
      expiresAt: computeLockExpiresAt(lastActivityAt).toISOString(),
    };
  }

  private toResponseDto(
    holderTrainerId: string,
    lastActivityAt: Date,
  ): Promise<ClientLockResponseDto> {
    return this.toStatusDto(holderTrainerId, lastActivityAt);
  }
}
