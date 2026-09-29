import { Link, useLocation, useParams } from 'react-router-dom';
import type { SessionSummaryDto } from '@/features/session/api/session-complete-api';
import { SessionSummaryView } from '@/features/session/ui/SessionSummaryView';
import { PageMeta } from '@/shared/ui/PageMeta';

type SummaryLocationState = {
  summary?: SessionSummaryDto;
};

export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as SummaryLocationState | null;
  const summary = state?.summary;

  if (!summary || summary.sessionId !== sessionId) {
    return (
      <>
        <PageMeta title="Итог сессии" />
        <p role="alert">Нет данных итога</p>
        <Link to={sessionId ? `/sessions/${sessionId}` : '/pool'}>Назад</Link>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Итог сессии" />
      <SessionSummaryView summary={summary} />
      <p className="surface-summary__back">
        <Link to="/pool">К пулу</Link>
      </p>
    </>
  );
}
