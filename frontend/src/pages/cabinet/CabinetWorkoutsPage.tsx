import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientWorkoutsOverviewPanel } from '@/features/client-workouts-overview/ui/ClientWorkoutsOverviewPanel';
import { LoadErrorWithRetry } from '@/features/diary/ui/LoadErrorWithRetry';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type MeResponse = components['schemas']['MeResponseDto'];

export function CabinetWorkoutsPage() {
  const [clientProfileId, setClientProfileId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const loadMe = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/auth/me');
    if (error || !data) {
      setClientProfileId(null);
      setLoadError(error?.error?.code ?? 'ME_LOAD_FAILED');
      setResolved(true);
      return;
    }
    const me = data as MeResponse;
    if (!me.clientProfileId) {
      setClientProfileId(null);
      setLoadError('CLIENT_PROFILE_MISSING');
      setResolved(true);
      return;
    }
    setClientProfileId(me.clientProfileId);
    setResolved(true);
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  return (
    <>
      <PageMeta title="Тренировки — Quest Fitness" robots="noindex,nofollow" />

      {loadError ? (
        <LoadErrorWithRetry message={loadError} onRetry={() => void loadMe()} />
      ) : null}

      {!loadError && (!resolved || !clientProfileId) ? (
        <p role="status">Загрузка…</p>
      ) : null}

      {!loadError && clientProfileId ? (
        <>
          <h1>Кабинет</h1>
          <p>
            <Link to="/cabinet/diary">Дневник</Link>
          </p>
          <ClientWorkoutsOverviewPanel
            clientId={clientProfileId}
            diaryTo="/cabinet/diary"
          />
        </>
      ) : null}
    </>
  );
}
