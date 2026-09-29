import { Injectable } from '@nestjs/common';
import { ClientProfile } from '@prisma/client';
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
