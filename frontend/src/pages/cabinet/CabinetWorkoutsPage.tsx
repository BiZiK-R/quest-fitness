import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { formatDayTimeLabel } from '@/shared/lib/format-date-ru';
import { pluralRu } from '@/shared/lib/plural-ru';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { StatusPill, type WorkoutStatus } from '@/shared/ui/StatusPill';
import { ChevronRightIcon } from '@/shared/ui/icons';
import { StreakChip } from '@/widgets/streak-chip/ui/StreakChip';
import './CabinetWorkoutsPage.css';

type Overview = components['schemas']['ClientWorkoutsOverviewDto'];
type OverviewItem = components['schemas']['WorkoutOverviewItemDto'];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; errorCode: string | null }
  | { status: 'ready'; overview: Overview };

export const NEXT_WORKOUT_EMPTY_COPY = {
  title: 'Следующий шаг ещё не назначен',
  line: 'Тренер назначит тренировку — она появится здесь',
} as const;

const PILL_STATUS: Record<OverviewItem['status'], WorkoutStatus> = {
  pending: 'waiting',
  attended: 'arrived',
  skipped: 'missed',
  cancelled: 'cancelled',
};

/** Клиент без профиля — сразу ошибка; иначе overview BFF (месяц и стрик считает сервер, AD-16/17). */
async function fetchOwnOverview(): Promise<LoadState> {
  const me = await apiClient.GET('/api/auth/me');
  if (me.error || !me.data) {
    return { status: 'error', errorCode: me.error?.error?.code ?? null };
  }
  const clientId = me.data.clientProfileId;
  if (!clientId) {
    return { status: 'error', errorCode: 'CLIENT_PROFILE_MISSING' };
  }
  const { data, error } = await apiClient.GET('/api/clients/{id}/workouts/overview', {
    params: { path: { id: clientId } },
  });
  if (error || !data) {
    return { status: 'error', errorCode: error?.error?.code ?? null };
  }
  return { status: 'ready', overview: data };
}

function WorkoutRow({ item }: { item: OverviewItem }) {
  return (
    <ListRow
      title={item.templateName ?? 'Тренировка'}
      meta={formatDayTimeLabel(item.scheduledAt)}
      metaPlacement="below"
      badge={<StatusPill status={PILL_STATUS[item.status]} />}
    />
  );
}

function WorkoutsOverview({ overview }: { overview: Overview }) {
  const next = overview.nextScheduled ?? null;
  const upcomingRest = overview.upcoming.filter((item) => item.id !== next?.id);
  const monthCount = `${overview.workoutsThisMonth} ${pluralRu(overview.workoutsThisMonth, [
    'тренировка',
    'тренировки',
    'тренировок',
  ])}`;

  return (
    <div className="cabinet-workouts">
      <StreakChip streak={overview.streak} />

      <section aria-labelledby="cabinet-next-title">
        <SectionTitle id="cabinet-next-title">Ближайшая тренировка</SectionTitle>
        {next ? (
          <ListCard>
            <WorkoutRow item={next} />
          </ListCard>
        ) : (
          <EmptyState
            size="title"
            title={NEXT_WORKOUT_EMPTY_COPY.title}
            description={NEXT_WORKOUT_EMPTY_COPY.line}
          />
        )}
      </section>

      {!overview.isEmpty ? (
        <section aria-labelledby="cabinet-month-title">
          <SectionTitle id="cabinet-month-title">Этот месяц</SectionTitle>
          <p className="cabinet-workouts__month type-meta type-muted" data-testid="workouts-month-summary">
            {overview.monthLabel} · {monthCount}
          </p>
          {upcomingRest.length > 0 ? (
            <ListCard label="Следующие тренировки">
              {upcomingRest.map((item) => (
                <WorkoutRow key={item.id} item={item} />
              ))}
            </ListCard>
          ) : null}
        </section>
      ) : null}

      <ListCard>
        <ListRow
          to="/cabinet/diary"
          title="Дневник"
          meta="Все прошедшие тренировки"
          metaPlacement="below"
          trailing={<ChevronRightIcon />}
        />
      </ListCard>
    </div>
  );
}

/** Кабинет → Тренировки: стартовая вкладка клиента. Шапку рисует CabinetLayout. */
export function CabinetWorkoutsPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    setState(await fetchOwnOverview());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageMeta title="Тренировки — Quest Fitness" robots="noindex,nofollow" />
      {state.status === 'loading' ? <PageState status="loading" /> : null}
      {state.status === 'error' ? (
        <PageState status="error" errorCode={state.errorCode} onRetry={() => void load()} />
      ) : null}
      {state.status === 'ready' ? <WorkoutsOverview overview={state.overview} /> : null}
    </>
  );
}
