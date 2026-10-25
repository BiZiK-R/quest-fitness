import { pluralRu } from '@/shared/lib/plural-ru';
import './StreakChip.css';

export type StreakChipProps = {
  /** Server-computed streak (AD-16); never derived on FE. */
  streak: number;
};

/**
 * Чип Стрика (DESIGN → streak-chip): число title + подпись meta.
 * Абрикос при стрике > 0; при 0 — крем и приглушённый текст, без красного.
 */
export function StreakChip({ streak }: StreakChipProps) {
  const isActive = streak > 0;
  const caption = `${pluralRu(streak, ['тренировка', 'тренировки', 'тренировок'])} подряд`;
  const classes = ['streak-chip', isActive ? 'streak-chip--active' : 'streak-chip--zero'].join(' ');

  return (
    <span className={classes} data-testid="streak-chip">
      <span className="streak-chip__number">{streak}</span>
      <span className="streak-chip__caption">{isActive ? caption : `${caption} — стрик копится`}</span>
    </span>
  );
}
