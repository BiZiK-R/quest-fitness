function parseDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stripDot(value: string): string {
  return value.replace(/\.$/, '');
}

/** Дата-заголовок строки дневника / итога: «29 сент, вт». */
export function formatDayLabel(iso: string): string {
  const date = parseDate(iso);
  if (!date) {
    return iso;
  }
  const day = date.getDate();
  const month = stripDot(date.toLocaleDateString('ru-RU', { month: 'short' }));
  const weekday = stripDot(date.toLocaleDateString('ru-RU', { weekday: 'short' }));
  return `${day} ${month}, ${weekday}`;
}

/** «29 сент, вт · 19:00» — для запланированной тренировки. */
export function formatDayTimeLabel(iso: string): string {
  const date = parseDate(iso);
  if (!date) {
    return iso;
  }
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${formatDayLabel(iso)} · ${time}`;
}

/** Ключ и подпись месяца для группировки списка: { key: '2026-09', label: 'Сентябрь 2026' }. */
export function monthGroupOf(iso: string): { key: string; label: string } {
  const date = parseDate(iso);
  if (!date) {
    return { key: 'unknown', label: 'Без даты' };
  }
  const month = date.toLocaleDateString('ru-RU', { month: 'long' });
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return { key, label: `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}` };
}

/** Длительность между двумя моментами: «52 мин», «1 ч 05 мин». null — если конца нет или даты битые. */
export function formatDurationBetween(startIso: string, endIso: string | null | undefined): string | null {
  const start = parseDate(startIso);
  const end = endIso ? parseDate(endIso) : null;
  if (!start || !end || end < start) {
    return null;
  }
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} мин`;
  }
  return `${hours} ч ${String(minutes).padStart(2, '0')} мин`;
}
