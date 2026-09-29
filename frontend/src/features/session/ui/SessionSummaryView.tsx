import type { SessionSummaryDto } from '../api/session-complete-api';
import './SessionSummaryView.css';

type Props = {
  summary: SessionSummaryDto;
};

function formatGrowth(growthPercent: number): string {
  const sign = growthPercent > 0 ? '+' : '';
  return `${sign}${growthPercent}%`;
}

export function SessionSummaryView({ summary }: Props) {
  return (
    <div className="surface-summary" data-testid="session-summary-surface">
      <header className="surface-summary__header">
        <h1>Итог сессии</h1>
        <p className="surface-summary__totals" data-testid="session-summary-totals">
          {summary.setCount} подходов · {summary.totalTonnageKg} кг
        </p>
      </header>

      <ul className="surface-summary__list">
        {summary.perExercise.map((row) => (
          <li key={row.exerciseId} className="surface-summary__row">
            <span className="surface-summary__name">{row.nameSnapshot}</span>
            <span className="surface-summary__meta">
              {row.setCount}× · {row.tonnageKg} кг
            </span>
            {row.firstTime ? (
              <span className="surface-summary__growth" data-testid={`session-growth-${row.exerciseId}`}>
                Первый раз
              </span>
            ) : row.growthPercent != null ? (
              <span className="surface-summary__growth" data-testid={`session-growth-${row.exerciseId}`}>
                {formatGrowth(row.growthPercent)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
