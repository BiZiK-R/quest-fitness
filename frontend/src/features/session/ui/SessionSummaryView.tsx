import type { SessionSummaryDto } from '../api/session-complete-api';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import './SessionSummaryView.css';

type Props = {
  summary: SessionSummaryDto;
};

function formatGrowth(growthPercent: number): string {
  const sign = growthPercent > 0 ? '+' : '';
  return `${sign}${growthPercent}% к прошлому`;
}

export function SessionSummaryView({ summary }: Props) {
  return (
    <div className="surface-summary" data-testid="session-summary-surface">
      <header className="surface-summary__header">
        <h1 className="type-display">Сессия завершена</h1>
        <p className="type-body type-muted">Итог тренировки</p>
      </header>

      <div className="surface-summary__stats" data-testid="session-summary-totals">
        <div className="surface-summary__stat">
          <span className="type-numeric">{summary.setCount}</span>
          <span className="type-meta type-muted">подходов</span>
        </div>
        <div className="surface-summary__stat">
          <span className="type-numeric">{summary.totalTonnageKg}</span>
          <span className="type-meta type-muted">кг тоннаж</span>
        </div>
        <div className="surface-summary__stat">
          <span className="type-numeric">{summary.perExercise.length}</span>
          <span className="type-meta type-muted">упражнений</span>
        </div>
      </div>

      {summary.perExercise.length > 0 ? (
        <section>
          <h2 className="type-title surface-summary__section-title">Рост</h2>
          <ListCard label="Рост по упражнениям">
            {summary.perExercise.map((row) => (
              <ListRow
                key={row.exerciseId}
                title={row.nameSnapshot}
                meta={
                  row.firstTime
                    ? 'Первый раз'
                    : row.growthPercent != null
                      ? formatGrowth(row.growthPercent)
                      : `${row.setCount}× · ${row.tonnageKg} кг`
                }
                metaPlacement="below"
              />
            ))}
          </ListCard>
        </section>
      ) : null}
    </div>
  );
}
