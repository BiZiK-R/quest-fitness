import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SessionWorkoutView } from '@/features/session/ui/SessionWorkoutView';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type SessionDto = components['schemas']['SessionDto'];

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setLoadError('NOT_FOUND');
      return;
    }
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/sessions/{id}', {
      params: { path: { id: sessionId } },
    });
    if (error || !data) {
      setSession(null);
      setLoadError(error?.error?.code ?? 'SESSION_LOAD_FAILED');
      return;
    }
    setSession(data);
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  if (loadError) {
    return (
      <>
        <PageMeta title="Сессия" />
        <p role="alert">{loadError}</p>
        <Link to="/pool">К пулу</Link>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PageMeta title="Сессия" />
        <p role="status">Загрузка…</p>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Сессия" />
      <SessionWorkoutView session={session} />
    </>
  );
}
