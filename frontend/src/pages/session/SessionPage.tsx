import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { completeSession } from '@/features/session/api/session-complete-api';
import { SessionWorkoutView } from '@/features/session/ui/SessionWorkoutView';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type SessionDto = components['schemas']['SessionDto'];

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completeBusy, setCompleteBusy] = useState(false);

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

  const handleComplete = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    setCompleteBusy(true);
    const { data, error } = await completeSession(sessionId);
    setCompleteBusy(false);
    if (error || !data) {
      setLoadError('SESSION_COMPLETE_FAILED');
      return;
    }
    navigate(`/sessions/${sessionId}/summary`, { state: { summary: data } });
  }, [navigate, sessionId]);

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
      <SessionWorkoutView
        session={session}
        onComplete={() => void handleComplete()}
        completeBusy={completeBusy}
      />
    </>
  );
}
