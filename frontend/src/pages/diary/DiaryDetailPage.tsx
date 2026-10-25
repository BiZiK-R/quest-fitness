import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { useCabinetShell } from '@/widgets/cabinet-shell/model/use-cabinet-shell';

type DiarySessionDetail = components['schemas']['DiarySessionDetailDto'];

type DiaryDetailPageProps = {
  sessionId?: string;
  backTo: string;
  /** В кабинете AppShell уже снаружи — только контент + useCabinetShell. */
  embedded?: boolean;
};

function sessionStatusLabel(detail: DiarySessionDetail): string {
  if (detail.incomplete) {
    return 'не завершена';
  }
  if (detail.status === 'completed') {
    return 'завершена';
  }
  if (detail.status === 'abandoned') {
    return 'прервана';
  }
  return 'завершена';
}

export function DiaryDetailPage({
  sessionId: sessionIdProp,
  backTo,
  embedded = false,
}: DiaryDetailPageProps) {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const sessionId = sessionIdProp ?? sessionIdParam;
  const [detail, setDetail] = useState<DiarySessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useCabinetShell('Сессия', embedded ? backTo : undefined);

  const loadDetail = useCallback(async () => {
    if (!sessionId) {
      setLoadError('NOT_FOUND');
      setDetail(null);
      return;
    }
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/diary/sessions/{sessionId}', {
      params: { path: { sessionId } },
    });
    if (error || !data) {
      setDetail(null);
      setLoadError(error?.error?.code ?? 'LOAD_FAILED');
      return;
    }
    setDetail(data);
  }, [sessionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const setsByExercise = useMemo(() => {
    if (!detail) {
      return new Map<string, DiarySessionDetail['sets']>();
    }
    const map = new Map<string, DiarySessionDetail['sets']>();
    for (const set of detail.sets) {
      const list = map.get(set.sessionExerciseId) ?? [];
      list.push(set);
      map.set(set.sessionExerciseId, list);
    }
    return map;
  }, [detail]);

  function renderContent() {
    if (loadError) {
      return (
        <PageState
          status="error"
          errorCode={loadError}
          message={errorMessageFor(loadError)}
          onRetry={() => void loadDetail()}
        />
      );
    }
    if (!detail) {
      return <PageState status="loading" />;
    }

    return (
      <div className="diary-detail">
        <EmptyState
          size="title"
          headingLevel={embedded ? 2 : 1}
          title={`Сессия ${sessionStatusLabel(detail)}`}
          description={
            <>
              Начало: {new Date(detail.startedAt).toLocaleString('ru-RU')} · Тоннаж:{' '}
              {detail.totalTonnageKg} кг
              {detail.authorDisplayName ? <> · {detail.authorDisplayName}</> : null}
            </>
          }
        />

        <SectionTitle>Упражнения</SectionTitle>
        {detail.exercises.length === 0 ? (
          <EmptyState
            size="title"
            title="Подходов нет"
            description="В этой сессии не зафиксировали подходы."
          />
        ) : (
          <ListCard label="Упражнения сессии">
            {detail.exercises.map((exercise) => {
              const sets = setsByExercise.get(exercise.id) ?? [];
              const meta =
                sets.length === 0
                  ? 'Без подходов'
                  : sets
                      .map((set) => {
                        const parts = [`${set.weightKg ?? '—'} кг × ${set.reps ?? '—'}`];
                        if (set.rpe != null) {
                          parts.push(`RPE ${set.rpe}`);
                        }
                        if (set.modifier) {
                          parts.push(set.modifier.name);
                        }
                        return parts.join(' · ');
                      })
                      .join('; ');
              return (
                <li key={exercise.id} className="ui-list-row__item">
                  <div className="ui-list-row">
                    <span className="ui-list-row__main">
                      <span className="ui-list-row__title">{exercise.nameSnapshot}</span>
                      <span className="ui-list-row__meta">{meta}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ListCard>
        )}
      </div>
    );
  }

  const body = (
    <>
      <PageMeta title="Сессия — дневник — Quest Fitness" robots="noindex,nofollow" />
      {renderContent()}
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <AppShell
      title="Сессия"
      leading={
        <IconButton label="Назад" onClick={() => navigate(backTo)}>
          <BackIcon />
        </IconButton>
      }
    >
      {body}
    </AppShell>
  );
}
