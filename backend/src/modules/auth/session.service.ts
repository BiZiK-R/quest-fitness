import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SESSION_TTL_MS } from './auth.constants';

export type SessionWithUser = {
  id: string;
  userId: string;
  csrfToken: string;
  expiresAt: Date;
  createdAt: Date;
  user: User;
};

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createSession(userId: string): Promise<SessionWithUser> {
    const csrfToken = this.generateCsrfToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        csrfToken,
        expiresAt,
      },
      include: { user: true },
    });

    return session;
  }

  async findValidSession(sessionId: string): Promise<SessionWithUser | null> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.delete({ where: { id: sessionId } });
      return null;
    }
    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.delete({ where: { id: sessionId } }).catch(() => undefined);
  }
}
