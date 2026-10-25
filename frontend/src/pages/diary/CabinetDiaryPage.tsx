import { useCallback, useEffect, useState } from 'react';
import { DiaryListPage } from '@/pages/diary/DiaryListPage';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';

type MeResponse = components['schemas']['MeResponseDto'];

export function CabinetDiaryPage() {
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

  if (loadError) {
    return (
      <>
        <PageMeta title="Дневник — Quest Fitness" robots="noindex,nofollow" />
        <PageState status="error" errorCode={loadError} onRetry={() => void loadMe()} />
      </>
    );
  }

  if (!resolved || !clientProfileId) {
    return (
      <>
        <PageMeta title="Дневник — Quest Fitness" robots="noindex,nofollow" />
        <PageState status="loading" />
      </>
    );
  }

  return (
    <DiaryListPage
      clientId={clientProfileId}
      embedded
      sessionDetailPath={(sessionId) => `/cabinet/diary/${sessionId}`}
    />
  );
}
