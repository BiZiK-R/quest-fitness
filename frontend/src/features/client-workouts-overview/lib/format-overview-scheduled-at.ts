/**
 * Formats workout scheduledAt for overview lists (display only, not calendar month logic).
 */
export function formatOverviewScheduledAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}
