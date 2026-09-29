import { Injectable } from '@nestjs/common';
import { ClientProfile } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientProfileDto } from './dto/client-profile.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return rows.map((row) => this.toDto(row));
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
    return this.toDto(row);
  }

  private toDto(row: ClientProfile): ClientProfileDto {
    return {
      id: row.id,
      displayName: row.displayName,
      userId: row.userId,
      deactivatedAt: row.deactivatedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
