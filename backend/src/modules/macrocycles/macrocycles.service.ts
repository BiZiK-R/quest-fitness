import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateMacrocycleRequestDto } from './dto/create-macrocycle-request.dto';
import { MacrocycleDto } from './dto/macrocycle.dto';
import { UpdateMacrocycleRequestDto } from './dto/update-macrocycle-request.dto';
import { toMacrocycleDto } from './macrocycle.mapper';

const macrocycleInclude = {
  stages: {
    orderBy: { sortOrder: 'asc' as const },
    include: { template: { select: { name: true } } },
  },
} satisfies Prisma.MacrocycleInclude;

@Injectable()
export class MacrocyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMacrocycles(): Promise<MacrocycleDto[]> {
    const rows = await this.prisma.macrocycle.findMany({
      include: macrocycleInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map(toMacrocycleDto);
  }

  async getMacrocycle(id: string): Promise<MacrocycleDto> {
    const row = await this.prisma.macrocycle.findUnique({
      where: { id },
      include: macrocycleInclude,
    });
    if (!row) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Macrocycle not found', 404);
    }
    return toMacrocycleDto(row);
  }

  async createMacrocycle(body: CreateMacrocycleRequestDto): Promise<MacrocycleDto> {
    await this.assertTemplatesExist(body.stages.map((s) => s.templateId));

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.macrocycle.create({
        data: {
          name: body.name,
          periodicityNote: body.periodicityNote ?? null,
          stages:
            body.stages.length > 0
              ? {
                  create: body.stages.map((stage) => ({
                    templateId: stage.templateId,
                    sortOrder: stage.sortOrder,
                  })),
                }
              : undefined,
        },
      });
      return tx.macrocycle.findUniqueOrThrow({
        where: { id: created.id },
        include: macrocycleInclude,
      });
    });

    return toMacrocycleDto(row);
  }

  async updateMacrocycle(id: string, body: UpdateMacrocycleRequestDto): Promise<MacrocycleDto> {
    const existing = await this.prisma.macrocycle.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Macrocycle not found', 404);
    }

    await this.assertTemplatesExist(body.stages.map((s) => s.templateId));

    const row = await this.prisma.$transaction(async (tx) => {
      const currentStages = await tx.macrocycleStage.findMany({
        where: { macrocycleId: id },
      });
      const incomingIds = new Set(
        body.stages.map((s) => s.id).filter((stageId): stageId is string => Boolean(stageId)),
      );
      const removedStageIds = currentStages
        .filter((stage) => !incomingIds.has(stage.id))
        .map((stage) => stage.id);

      if (removedStageIds.length > 0) {
        await tx.clientMacroProgress.updateMany({
          where: {
            macrocycleId: id,
            currentStageId: { in: removedStageIds },
          },
          data: { currentStageId: null },
        });
        await tx.macrocycleStage.deleteMany({
          where: { id: { in: removedStageIds } },
        });
      }

      const keptStages = body.stages.filter(
        (stage) => stage.id && currentStages.some((s) => s.id === stage.id),
      );
      for (let i = 0; i < keptStages.length; i += 1) {
        const stage = keptStages[i]!;
        await tx.macrocycleStage.update({
          where: { id: stage.id! },
          data: { sortOrder: -(i + 1) },
        });
      }

      for (const stage of body.stages) {
        if (stage.id && currentStages.some((s) => s.id === stage.id)) {
          await tx.macrocycleStage.update({
            where: { id: stage.id },
            data: {
              templateId: stage.templateId,
              sortOrder: stage.sortOrder,
            },
          });
        } else {
          await tx.macrocycleStage.create({
            data: {
              macrocycleId: id,
              templateId: stage.templateId,
              sortOrder: stage.sortOrder,
            },
          });
        }
      }

      await tx.macrocycle.update({
        where: { id },
        data: {
          name: body.name,
          periodicityNote: body.periodicityNote ?? null,
        },
      });

      return tx.macrocycle.findUniqueOrThrow({
        where: { id },
        include: macrocycleInclude,
      });
    });

    return toMacrocycleDto(row);
  }

  private async assertTemplatesExist(templateIds: string[]): Promise<void> {
    const unique = [...new Set(templateIds)];
    if (unique.length === 0) {
      return;
    }
    const found = await this.prisma.workoutTemplate.findMany({
      where: { id: { in: unique }, archivedAt: null },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout template not found', 404);
    }
  }
}
