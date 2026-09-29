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
/**
 * Russian month label for a gym-local YYYY-MM key (BFF-only, AD-17).
 */
export function formatGymMonthLabel(monthKey: string, timeZone = getGymTimezone()): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const anchor = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(anchor);
}

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
