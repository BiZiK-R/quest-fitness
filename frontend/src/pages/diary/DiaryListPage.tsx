import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { formatDayTimeLabel } from '@/shared/lib/format-date-ru';
import { AppShell } from '@/shared/ui/AppShell';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon, ChevronRightIcon } from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';

type DiaryEntry = components['schemas']['DiaryEntryDto'];

type DiaryListPageProps = {
  clientId?: string;
  /** Если задан — страница сама рисует AppShell с «Назад». В кабинете — без shell. */
  backTo?: string;
  sessionDetailPath: (sessionId: string) => string;
  /** Заголовок appbar / h1 в кабинете. */
  title?: string;
  /** В кабинете AppShell уже снаружи. */
  embedded?: boolean;
};

function monthLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function entryMeta(entry: DiaryEntry): string {
  const parts = [`${entry.setCount} подх.`, `${entry.totalTonnageKg} кг`];
  if (entry.authorDisplayName) {
    parts.push(entry.authorDisplayName);
  }
  if (entry.incomplete) {
    parts.push('не завершена');
  }
  return parts.join(' · ');
}

export function DiaryListPage({
  clientId: clientIdProp,
  backTo,
  sessionDetailPath,
  title = 'Дневник',
  embedded = false,
}: DiaryListPageProps) {
  const navigate = useNavigate();
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
    setEntries(data.entries);
  }, [clientId]);

  useEffect(() => {
    void loadDiary();
  }, [loadDiary]);

  const byMonth = useMemo(() => {
    if (!entries?.length) {
      return [] as Array<{ label: string; items: DiaryEntry[] }>;
    }
    const map = new Map<string, DiaryEntry[]>();
    for (const entry of entries) {
      const key = monthLabel(entry.completedAt ?? entry.startedAt);
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [entries]);

  function renderContent() {
    if (loadError) {
      return (
        <PageState
          status="error"
          errorCode={loadError}
          onRetry={() => void loadDiary()}
        />
      );
    }
    if (!entries) {
      return <PageState status="loading" />;
    }
    if (entries.length === 0) {
      return (
        <EmptyState
          title="Летопись пуста"
          description="Первая запись появится после первой тренировки."
        />
      );
    }
    return (
      <div className="diary-list">
        {byMonth.map((group) => (
          <section key={group.label}>
            {group.label ? <SectionTitle>{group.label}</SectionTitle> : null}
            <ListCard label={group.label || 'Записи дневника'}>
              {group.items.map((entry) => (
                <ListRow
                  key={entry.sessionId}
                  to={sessionDetailPath(entry.sessionId)}
                  title={formatDayTimeLabel(entry.completedAt ?? entry.startedAt)}
                  meta={entryMeta(entry)}
                  metaPlacement="below"
                  trailing={<ChevronRightIcon />}
                />
              ))}
            </ListCard>
          </section>
        ))}
      </div>
    );
  }

  const body = (
    <>
      <PageMeta title={`${title} — Quest Fitness`} robots="noindex,nofollow" />
      {renderContent()}
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <AppShell
      title={title}
      leading={
        backTo ? (
          <IconButton label="Назад" onClick={() => navigate(backTo)}>
            <BackIcon />
          </IconButton>
        ) : undefined
      }
    >
      {body}
    </AppShell>
  );
}
