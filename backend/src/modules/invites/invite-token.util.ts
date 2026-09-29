import { createHash } from 'node:crypto';

/** SHA-256 hex digest opaque invite token (AD-5). */
export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
