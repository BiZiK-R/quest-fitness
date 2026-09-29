import { CLIENT_LOCK_IDLE_TTL_MS } from './client-lock.constants';

/**
 * Server-computed lock expiry (sole countdown source for UI).
 */
export function computeLockExpiresAt(lastActivityAt: Date): Date {
  return new Date(lastActivityAt.getTime() + CLIENT_LOCK_IDLE_TTL_MS);
}

/** True when lastActivityAt + TTL is before now. */
export function isLockExpired(lastActivityAt: Date, now: Date = new Date()): boolean {
  return computeLockExpiresAt(lastActivityAt).getTime() <= now.getTime();
}
