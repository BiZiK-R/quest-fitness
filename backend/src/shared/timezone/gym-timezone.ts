const DEFAULT_GYM_TIMEZONE = 'Europe/Moscow';

/**
 * Таймзона зала из env (AD-17); календарные подписи считаются только на BFF.
 */
export function getGymTimezone(): string {
  return process.env.GYM_TIMEZONE?.trim() || DEFAULT_GYM_TIMEZONE;
}

/**
 * Человекочитаемая метка срока действия инвайта в таймзоне зала.
 */
export function formatInviteExpiryLabel(expiresAt: Date, timeZone = getGymTimezone()): string {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `до ${formatter.format(expiresAt)}`;
}
