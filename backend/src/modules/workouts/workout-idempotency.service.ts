import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { IDEMPOTENCY_REPLAY_TTL_MS } from './workout-idempotency.constants';

type CachedIdempotency = {
  responseStatus: number;
  responseBody: unknown;
};

@Injectable()
export class WorkoutIdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns stored response when key is still within the 24h replay window. */
  async findReplay(scope: string, idempotencyKey: string): Promise<CachedIdempotency | null> {
    const row = await this.prisma.idempotencyRecord.findUnique({
      where: {
        scope_idempotencyKey: { scope, idempotencyKey },
      },
    });
    if (!row) {
      return null;
    }
    const ageMs = Date.now() - row.createdAt.getTime();
    if (ageMs > IDEMPOTENCY_REPLAY_TTL_MS) {
      return null;
    }
    return {
      responseStatus: row.responseStatus,
      responseBody: row.responseBody,
    };
  }

  async store(
    scope: string,
    idempotencyKey: string,
    actorUserId: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          idempotencyKey,
          scope,
          actorUserId,
          responseStatus,
          responseBody: responseBody as Prisma.InputJsonValue,
        },
      });
    } catch {
      const replay = await this.findReplay(scope, idempotencyKey);
      if (replay) {
        return;
      }
      throw new Error('Idempotency record conflict');
    }
  }
}
