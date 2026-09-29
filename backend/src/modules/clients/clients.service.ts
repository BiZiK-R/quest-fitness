import { Injectable } from '@nestjs/common';
import { ClientProfile } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { computeLockExpiresAt, isLockExpired } from '../clients-lock/client-lock.util';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import { ClientProfileDto } from './dto/client-profile.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsLockService: ClientsLockService,
  ) {}

  async create(displayName: string): Promise<ClientProfileDto> {
    const row = await this.prisma.clientProfile.create({
      data: { displayName },
    });
    return this.toDto(row);
  }

  async listPool(): Promise<ClientProfileDto[]> {
    const rows = await this.prisma.clientProfile.findMany({
      orderBy: { createdAt: 'asc' },
    });
    if (rows.length === 0) {
      return [];
    }
    const locks = await this.prisma.clientLock.findMany({
      where: { clientId: { in: rows.map((row) => row.id) } },
    });
    const lockByClientId = new Map(locks.map((lock) => [lock.clientId, lock]));
    return rows.map((row) => {
      const lock = lockByClientId.get(row.id);
      const lockStatus =
        lock && !isLockExpired(lock.lastActivityAt)
          ? {
              holderTrainerId: lock.holderTrainerId,
              expiresAt: computeLockExpiresAt(lock.lastActivityAt).toISOString(),
            }
          : null;
      return this.toDto(row, lockStatus);
    });
  }

  /**
   * Read-only client profile for pool card view.
   * Does not create or touch ClientLock (Story 2.5).
   */
  async getById(id: string): Promise<ClientProfileDto> {
    const row = await this.prisma.clientProfile.findUnique({
      where: { id },
    });
    if (!row) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }
    const lockStatus = await this.clientsLockService.getLiveLockStatus(id);
    return this.toDto(row, lockStatus);
  }

  private toDto(
    row: ClientProfile,
    lockStatus: ClientProfileDto['lockStatus'] = null,
  ): ClientProfileDto {
    return {
      id: row.id,
      displayName: row.displayName,
      userId: row.userId,
      deactivatedAt: row.deactivatedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lockStatus: lockStatus ?? null,
    };
  }
}
