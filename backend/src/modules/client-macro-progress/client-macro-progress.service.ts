import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClientsLockService } from '../clients-lock/clients-lock.service';
import {
  buildMacroProgressSummaryFromRow,
  type MacroProgressMacrocycleRow,
} from './client-macro-progress.mapper';
import { AssignClientMacroProgressRequestDto } from './dto/assign-client-macro-progress-request.dto';
import { ClientMacroProgressSummaryDto } from './dto/client-macro-progress-summary.dto';

const macrocycleWithStagesInclude = {
  stages: {
    orderBy: { sortOrder: 'asc' as const },
  },
};

@Injectable()
export class ClientMacroProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsLockService: ClientsLockService,
  ) {}

  async assign(
    clientId: string,
    actorUserId: string,
    body: AssignClientMacroProgressRequestDto,
  ): Promise<ClientMacroProgressSummaryDto> {
    await this.clientsLockService.assertActorHoldsLiveLock(clientId, actorUserId);
    await this.ensureClientExists(clientId);

    const macrocycle = await this.prisma.macrocycle.findUnique({
      where: { id: body.macrocycleId },
      include: macrocycleWithStagesInclude,
    });
    if (!macrocycle) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Macrocycle not found', 404);
    }

    const resolvedStageId = this.resolveStageId(macrocycle, body.currentStageId);

    const row = await this.prisma.clientMacroProgress.upsert({
      where: { clientProfileId: clientId },
      create: {
        clientProfileId: clientId,
        macrocycleId: body.macrocycleId,
        currentStageId: resolvedStageId,
      },
      update: {
        macrocycleId: body.macrocycleId,
        currentStageId: resolvedStageId,
      },
      include: {
        macrocycle: { include: macrocycleWithStagesInclude },
      },
    });

    return buildMacroProgressSummaryFromRow(row);
  }

  async overrideStage(
    clientId: string,
    actorUserId: string,
    currentStageId: string,
  ): Promise<ClientMacroProgressSummaryDto> {
    await this.clientsLockService.assertActorHoldsLiveLock(clientId, actorUserId);
    await this.ensureClientExists(clientId);

    const existing = await this.prisma.clientMacroProgress.findUnique({
      where: { clientProfileId: clientId },
      include: {
        macrocycle: { include: macrocycleWithStagesInclude },
      },
    });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client macro progress not found', 404);
    }

    this.assertStageBelongsToMacrocycle(existing.macrocycle, currentStageId);

    const row = await this.prisma.clientMacroProgress.update({
      where: { clientProfileId: clientId },
      data: { currentStageId },
      include: {
        macrocycle: { include: macrocycleWithStagesInclude },
      },
    });

    return buildMacroProgressSummaryFromRow(row);
  }

  /** Loads summary for client profile card (read-only). */
  async getSummaryForClient(clientId: string): Promise<ClientMacroProgressSummaryDto | null> {
    const row = await this.prisma.clientMacroProgress.findUnique({
      where: { clientProfileId: clientId },
      include: {
        macrocycle: { include: macrocycleWithStagesInclude },
      },
    });
    if (!row) {
      return null;
    }
    return buildMacroProgressSummaryFromRow(row);
  }

  private resolveStageId(
    macrocycle: MacroProgressMacrocycleRow,
    requestedStageId: string | undefined,
  ): string | null {
    if (requestedStageId !== undefined) {
      this.assertStageBelongsToMacrocycle(macrocycle, requestedStageId);
      return requestedStageId;
    }
    const first = macrocycle.stages[0];
    return first?.id ?? null;
  }

  private assertStageBelongsToMacrocycle(
    macrocycle: MacroProgressMacrocycleRow,
    stageId: string,
  ): void {
    const belongs = macrocycle.stages.some((s) => s.id === stageId);
    if (!belongs) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Stage does not belong to macrocycle',
        400,
      );
    }
  }

  private async ensureClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }
  }
}
