import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { isKnownSetModifierColorToken } from '../../shared/set-modifiers/set-modifier-palette';
import { CreateSetModifierRequestDto } from './dto/create-set-modifier-request.dto';
import { SetModifierDto } from './dto/set-modifier.dto';
import { toSetModifierDto } from './set-modifier.mapper';

@Injectable()
export class ModifiersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<SetModifierDto[]> {
    const rows = await this.prisma.setModifier.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(toSetModifierDto);
  }

  async createCustom(actorUserId: string, body: CreateSetModifierRequestDto): Promise<SetModifierDto> {
    this.assertValidColorToken(body.colorToken);

    const row = await this.prisma.setModifier.create({
      data: {
        name: body.name.trim(),
        colorToken: body.colorToken,
        isPreset: false,
        createdByUserId: actorUserId,
      },
    });
    return toSetModifierDto(row);
  }

  async archive(id: string): Promise<SetModifierDto> {
    const existing = await this.prisma.setModifier.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Set modifier not found', 404);
    }
    if (existing.archivedAt) {
      return toSetModifierDto(existing);
    }

    const row = await this.prisma.setModifier.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return toSetModifierDto(row);
  }

  assertValidColorToken(colorToken: string): void {
    if (!isKnownSetModifierColorToken(colorToken)) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Unknown modifier color token', 400);
    }
  }
}
