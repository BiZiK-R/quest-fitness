import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workoutStatusLabel } from '@/features/client-workout-schedule/lib/workout-schedule-labels';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { formatOverviewScheduledAt } from '../lib/format-overview-scheduled-at';

type Overview = components['schemas']['ClientWorkoutsOverviewDto'];
type OverviewItem = components['schemas']['WorkoutOverviewItemDto'];

type Props = {
  clientId: string;
  diaryTo: string;
  /** Compact block for trainer client card (Story 6.1). */
  compact?: boolean;
};

export const WORKOUTS_OVERVIEW_EMPTY_COPY = 'Первый поход ещё впереди';

function OverviewRow({ item }: { item: OverviewItem }) {
  return (
    <li>
      <span>{formatOverviewScheduledAt(item.scheduledAt)}</span>
      {item.templateName ? <span> — {item.templateName}</span> : null}
      <span> ({workoutStatusLabel(item.status)})</span>
      {item.isOverdue ? <span> — просрочена</span> : null}
    </li>
  );
}

export function ClientWorkoutsOverviewPanel({ clientId, diaryTo, compact = false }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/clients/{id}/workouts/overview', {
      params: { path: { id: clientId } },
    });
    if (error || !data) {
      setOverview(null);
      setLoadError(error?.error?.code ?? 'OVERVIEW_LOAD_FAILED');
      return;
    }
    setOverview(data);
  }, [clientId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loadError) {
    return (
      <section aria-label="Обзор тренировок">
        <p role="alert">{loadError}</p>
        <button type="button" onClick={() => void loadOverview()}>
          Повторить
        </button>
      </section>
    );
  }

  if (!overview) {
    return (
      <section aria-label="Обзор тренировок">
        <p role="status">Загрузка…</p>
      </section>
    );
  }

  const heading = compact ? 'Обзор тренировок' : 'Тренировки в этом месяце';

  return (
    <section aria-label="Обзор тренировок">
      {!compact ? <h2>{heading}</h2> : <h3>{heading}</h3>}

      {overview.isEmpty ? (
        <p role="status">{WORKOUTS_OVERVIEW_EMPTY_COPY}</p>
      ) : (
        <>
          <p data-testid="workouts-month-summary">
            {overview.monthLabel}: {overview.workoutsThisMonth} тренировок
          </p>

          {overview.nextScheduled ? (
            <div data-testid="workouts-next-scheduled">
              <p>
                <strong>Запланирована:</strong>{' '}
                {formatOverviewScheduledAt(overview.nextScheduled.scheduledAt)}
                {overview.nextScheduled.templateName
                  ? ` — ${overview.nextScheduled.templateName}`
                  : ''}
              </p>
            </div>
          ) : null}

          {overview.upcoming.length > 0 ? (
            <>
              <p>Ближайшие:</p>
              <ul>
                {overview.upcoming.map((item) => (
                  <OverviewRow key={item.id} item={item} />
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}

      <p>
        <Link to={diaryTo}>Дневник тренировок</Link>
      </p>
    </section>
  );
}
