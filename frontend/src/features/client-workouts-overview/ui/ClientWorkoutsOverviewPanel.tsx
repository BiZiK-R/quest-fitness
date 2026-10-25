import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workoutStatusLabel } from '@/features/client-workout-schedule/lib/workout-schedule-labels';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { StreakChip } from '@/widgets/streak-chip/ui/StreakChip';
import { formatOverviewScheduledAt } from '../lib/format-overview-scheduled-at';

type Overview = components['schemas']['ClientWorkoutsOverviewDto'];
type OverviewItem = components['schemas']['WorkoutOverviewItemDto'];

type Props = {
  clientId: string;
  diaryTo: string;
  /** Compact block for trainer client card (Story 6.1). */
  compact?: boolean;
  /** Правки закрыты (клиент не взят) — empty-копирайт без ложных инструкций. */
  mutationsDisabled?: boolean;
};

export const WORKOUTS_OVERVIEW_EMPTY_TITLE = 'Тренировок в этом месяце нет';

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

export function ClientWorkoutsOverviewPanel({
  clientId,
  diaryTo,
  compact = false,
  mutationsDisabled = false,
}: Props) {
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
      <div className="client-workouts-overview">
        <p className="type-meta" role="alert" style={{ color: 'var(--color-ink-error)' }}>
          {errorMessageFor(loadError)}
        </p>
        <Button variant="secondary" onClick={() => void loadOverview()}>
          Повторить
        </Button>
      </div>
    );
  }

  if (!overview) {
    return (
      <p className="type-meta type-muted" role="status">
        Загрузка…
      </p>
    );
  }

  const showStreak = overview.streak > 0;
  /** На карточке тренера empty ведёт в «Расписание» — без второй стены EmptyState. */
  const showEmptyWall = overview.isEmpty && !compact;

  return (
    <div className="client-workouts-overview">
      {!compact ? <h2>Тренировки в этом месяце</h2> : null}

      {showStreak ? (
        <p data-testid="workouts-streak">
          <StreakChip streak={overview.streak} />
        </p>
      ) : null}

      {showEmptyWall ? (
        <EmptyState
          size="title"
          title={WORKOUTS_OVERVIEW_EMPTY_TITLE}
          description={
            mutationsDisabled
              ? 'Чтобы назначить тренировку, сначала возьмите клиента.'
              : 'Назначьте тренировку клиенту или откройте дневник.'
          }
        />
      ) : null}

      {!overview.isEmpty ? (
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
              <p className="type-meta type-muted">Ближайшие</p>
              <ul>
                {overview.upcoming.map((item) => (
                  <OverviewRow key={item.id} item={item} />
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}

      {!compact ? (
        <p>
          <Link to={diaryTo}>Дневник тренировок</Link>
        </p>
      ) : null}
    </div>
  );
}
