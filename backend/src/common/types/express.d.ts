import { AuthSession, User } from '@prisma/client';

export type RequestSession = AuthSession & { user: User };

declare global {
  namespace Express {
    interface Request {
      session?: RequestSession;
      user?: User;
    }
  }
}

export {};
