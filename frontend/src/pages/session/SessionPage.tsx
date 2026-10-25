import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { completeSession } from '@/features/session/api/session-complete-api';
import { SessionWorkoutView } from '@/features/session/ui/SessionWorkoutView';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';

type SessionDto = components['schemas']['SessionDto'];

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
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
    setCompleteError(null);
    setCompleteBusy(true);
    const { data, error } = await completeSession(sessionId);
    setCompleteBusy(false);
    if (error || !data) {
      setCompleteError('SESSION_COMPLETE_FAILED');
      return;
    }
    navigate(`/sessions/${sessionId}/summary`, { state: { summary: data } });
  }, [navigate, sessionId]);

  return (
    <AppShell
      title="Сессия"
      surface="session"
      leading={
        <IconButton label="К пулу" onClick={() => navigate('/pool')}>
          <BackIcon />
        </IconButton>
      }
    >
      <PageMeta title="Сессия — Quest Fitness" robots="noindex,nofollow" />

      {loadError ? (
        <>
          <PageState
            status="error"
            errorCode={loadError}
            message={errorMessageFor(loadError)}
            onRetry={() => void loadSession()}
          />
          <Button variant="secondary" fullWidth onClick={() => navigate('/pool')}>
            К пулу
          </Button>
        </>
      ) : !session ? (
        <PageState status="loading" />
      ) : session.status !== 'active' ? (
        <EmptyState
          headingLevel={1}
          title="Сессия уже закрыта"
          description="Эту тренировку нельзя продолжить. Откройте итог или вернитесь в пул."
          action={
            <Button variant="primary" fullWidth onClick={() => navigate('/pool')}>
              К пулу
            </Button>
          }
        />
      ) : (
        <>
          {completeError ? (
            <p className="type-meta" role="alert" style={{ color: 'var(--color-ink-error)' }}>
              {errorMessageFor(completeError)}
            </p>
          ) : null}
          <SessionWorkoutView
            session={session}
            onComplete={() => void handleComplete()}
            completeBusy={completeBusy}
          />
        </>
      )}
    </AppShell>
  );
}
