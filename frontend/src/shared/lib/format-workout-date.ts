const TIME_FORMAT = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const DAY_MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const RELATIVE_DAY_LABEL: Record<number, string> = {
  [-1]: 'вчера',
  0: 'сегодня',
  1: 'завтра',
};

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Дата Тренировки словами, как в макете Пула: «сегодня 19:00», «завтра 08:30», «1 окт., 07:00».
 * Год добавляется только если он не текущий. Невалидная строка возвращается как есть.
 */
export function formatWorkoutDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const time = TIME_FORMAT.format(date);
  const dayDiff = Math.round((startOfLocalDay(date) - startOfLocalDay(now)) / 86_400_000);
  const relative = RELATIVE_DAY_LABEL[dayDiff];
  if (relative) {
    return `${relative} ${time}`;
  }

  const dayFormat = date.getFullYear() === now.getFullYear() ? DAY_MONTH_FORMAT : DAY_MONTH_YEAR_FORMAT;
  return `${dayFormat.format(date)}, ${time}`;
}
