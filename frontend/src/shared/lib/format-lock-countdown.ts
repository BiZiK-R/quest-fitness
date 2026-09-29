/**
 * Human-readable remaining time until lock expires (server expiresAt).
 */
export function formatLockCountdown(expiresAtIso: string, nowMs: number = Date.now()): string {
  const remainingMs = new Date(expiresAtIso).getTime() - nowMs;
  if (remainingMs <= 0) {
    return 'скоро освободится';
  }
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  }
  return `${totalMinutes} мин`;
}
