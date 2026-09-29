import { Injectable } from '@nestjs/common';
import { SessionStatus, UserRole } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { toSessionExerciseDto, toSetDto } from '../sessions/session.mapper';
import { DiaryEntryDto } from './dto/diary-entry.dto';
import { DiaryListResponseDto } from './dto/diary-list-response.dto';
import { DiarySessionDetailDto } from './dto/diary-session-detail.dto';
import { aggregateSetTonnage } from './lib/diary-tonnage.util';

const diaryListStatuses: SessionStatus[] = [SessionStatus.completed, SessionStatus.abandoned];

const setWithModifierInclude = {
  modifier: true,
} as const;

const sessionDetailInclude = {
  exercises: true,
  sets: {
    orderBy: { sequenceIndex: 'asc' as const },
    include: setWithModifierInclude,
  },
  authorTrainer: { select: { login: true } },
} as const;

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read-only diary list for a client (completed + abandoned sessions).
   */
  async listForClient(
    clientProfileId: string,
    actorUserId: string,
    actorRole: UserRole,
  ): Promise<DiaryListResponseDto> {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientProfileId },
    });
    if (!client) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Client not found', 404);
    }

    await this.assertCanReadClientDiary(actorUserId, actorRole, clientProfileId);

    const sessions = await this.prisma.session.findMany({
      where: {
        clientProfileId,
        status: { in: diaryListStatuses },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        sets: true,
        authorTrainer: { select: { login: true } },
      },
    });

    const entries: DiaryEntryDto[] = sessions.map((session) => {
      const { setCount, totalTonnageKg } = aggregateSetTonnage(session.sets);
      return {
        sessionId: session.id,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
        abandonedAt: session.abandonedAt?.toISOString() ?? null,
        authorTrainerId: session.authorTrainerId,
        authorDisplayName: session.authorTrainer.login,
        workoutId: session.workoutId,
        setCount,
        totalTonnageKg,
        incomplete: session.status === SessionStatus.abandoned,
      };
    });

    return { entries };
  }

  /**
   * Read-only diary session detail including sets and modifiers (AD-15 abandoned readable).
   */
  async getSessionDetail(
    sessionId: string,
    actorUserId: string,
    actorRole: UserRole,
  ): Promise<DiarySessionDetailDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: sessionDetailInclude,
    });
    if (!session) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Session not found', 404);
    }

    await this.assertCanReadClientDiary(actorUserId, actorRole, session.clientProfileId);

    const { totalTonnageKg } = aggregateSetTonnage(session.sets);
    const exercises = session.exercises
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toSessionExerciseDto);
    const sets = session.sets.map(toSetDto);

    return {
      sessionId: session.id,
      workoutId: session.workoutId,
      clientProfileId: session.clientProfileId,
      authorTrainerId: session.authorTrainerId,
      authorDisplayName: session.authorTrainer.login,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      abandonedAt: session.abandonedAt?.toISOString() ?? null,
      incomplete: session.status === SessionStatus.abandoned,
      totalTonnageKg,
      exercises,
      sets,
    };
  }

  private async assertCanReadClientDiary(
    actorUserId: string,
    actorRole: UserRole,
    clientProfileId: string,
  ): Promise<void> {
    if (actorRole === UserRole.TRAINER || actorRole === UserRole.ADMIN) {
      return;
    }
    if (actorRole === UserRole.CLIENT) {
      const linked = await this.prisma.clientProfile.findUnique({
        where: { userId: actorUserId },
      });
      if (!linked || linked.id !== clientProfileId) {
        throw new AppException(ErrorCode.FORBIDDEN_ROLE, 'Forbidden', 403);
      }
      return;
    }
    throw new AppException(ErrorCode.FORBIDDEN_ROLE, 'Forbidden', 403);
  }
}
