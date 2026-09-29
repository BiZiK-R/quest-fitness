import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadErrorWithRetry } from '@/features/diary/ui/LoadErrorWithRetry';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type DiaryListResponse = components['schemas']['DiaryListResponseDto'];
type DiaryEntry = components['schemas']['DiaryEntryDto'];

type DiaryListPageProps = {
  clientId?: string;
  backTo?: string;
  backLabel?: string;
  sessionDetailPath: (sessionId: string) => string;
};

export function DiaryListPage({
  clientId: clientIdProp,
  backTo,
  backLabel = '← Назад',
  sessionDetailPath,
}: DiaryListPageProps) {
  const { clientId: clientIdParam } = useParams<{ clientId: string }>();
  const clientId = clientIdProp ?? clientIdParam;
  const [entries, setEntries] = useState<DiaryEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDiary = useCallback(async () => {
    if (!clientId) {
      setLoadError('NOT_FOUND');
      setEntries(null);
      return;
    }
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/clients/{clientId}/diary', {
      params: { path: { clientId } },
    });
    if (error || !data) {
      setEntries(null);
      setLoadError(error?.error?.code ?? 'LOAD_FAILED');
      return;
    }
    setEntries((data as DiaryListResponse).entries);
  }, [clientId]);

  useEffect(() => {
    void loadDiary();
  }, [loadDiary]);

  if (loadError) {
    return (
      <>
        <PageMeta title="Дневник — Quest Fitness" robots="noindex,nofollow" />
        <LoadErrorWithRetry message={loadError} onRetry={() => void loadDiary()} />
      </>
    );
  }

  if (!entries) {
    return (
      <>
        <PageMeta title="Дневник — Quest Fitness" robots="noindex,nofollow" />
        <p role="status">Загрузка…</p>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Дневник — Quest Fitness" robots="noindex,nofollow" />
      {backTo ? (
        <p>
          <Link to={backTo}>{backLabel}</Link>
        </p>
      ) : null}
      <h1>Дневник</h1>
      {entries.length === 0 ? <p>Записей пока нет.</p> : null}
      <ul>
        {entries.map((entry) => (
          <li key={entry.sessionId}>
            <Link to={sessionDetailPath(entry.sessionId)}>
              {new Date(entry.startedAt).toLocaleString('ru-RU')}
              {entry.incomplete ? <> — не завершена</> : null}
            </Link>
            <span>
              {' '}
              · {entry.setCount} подходов · {entry.totalTonnageKg} кг
              {entry.authorDisplayName ? <> · {entry.authorDisplayName}</> : null}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
