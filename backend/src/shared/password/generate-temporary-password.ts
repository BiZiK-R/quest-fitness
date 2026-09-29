import { randomBytes } from 'node:crypto';

/**
 * Генерирует одноразовый временный пароль (≥8 символов) для admin reset.
 */
export function generateTemporaryPassword(): string {
  return randomBytes(12).toString('base64url');
}
