import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadErrorWithRetry } from '@/features/diary/ui/LoadErrorWithRetry';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type DiarySessionDetail = components['schemas']['DiarySessionDetailDto'];

type DiaryDetailPageProps = {
  sessionId?: string;
  backTo: string;
  backLabel?: string;
};

export function DiaryDetailPage({
  sessionId: sessionIdProp,
  backTo,
  backLabel = '← К дневнику',
}: DiaryDetailPageProps) {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const sessionId = sessionIdProp ?? sessionIdParam;
  const [detail, setDetail] = useState<DiarySessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  if (loadError) {
    return (
      <>
        <PageMeta title="Сессия — дневник" robots="noindex,nofollow" />
        <LoadErrorWithRetry message={loadError} onRetry={() => void loadDetail()} />
      </>
    );
  }

  if (!detail) {
    return (
      <>
        <PageMeta title="Сессия — дневник" robots="noindex,nofollow" />
        <p role="status">Загрузка…</p>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Сессия — дневник" robots="noindex,nofollow" />
      <p>
        <Link to={backTo}>{backLabel}</Link>
      </p>
      <h1>
        Сессия{' '}
        {detail.incomplete ? (
          <span role="status">не завершена</span>
        ) : (
          <span>{detail.status}</span>
        )}
      </h1>
      <p>
        Начало: {new Date(detail.startedAt).toLocaleString('ru-RU')} · Тоннаж: {detail.totalTonnageKg}{' '}
        кг
        {detail.authorDisplayName ? <> · {detail.authorDisplayName}</> : null}
      </p>
      <ol>
        {detail.exercises.map((exercise) => (
          <li key={exercise.id}>
            <strong>{exercise.nameSnapshot}</strong>
            <ul>
              {(setsByExercise.get(exercise.id) ?? []).map((set) => (
                <li key={set.id}>
                  {set.weightKg ?? '—'} кг × {set.reps ?? '—'}
                  {set.rpe != null ? <> · RPE {set.rpe}</> : null}
                  {set.modifier ? <> · {set.modifier.name}</> : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
