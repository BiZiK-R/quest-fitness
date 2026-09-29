import './StreakChip.css';

export type StreakChipProps = {
  /** Server-computed streak (AD-16); never derived on FE. */
  streak: number;
};

/**
 * Workout streak indicator — apricot when active, cream «копится» at zero.
 */
export function StreakChip({ streak }: StreakChipProps) {
  if (streak > 0) {
    return (
      <span
        className="streak-chip streak-chip--active"
        aria-label={`Стрик тренировок: ${streak} подряд`}
        data-testid="streak-chip"
      >
        {streak}
      </span>
    );
  }

  return (
    <span className="streak-chip streak-chip--accumulating" data-testid="streak-chip">
      копится
    </span>
  );
}
