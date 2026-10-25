import { useNavigate, useLocation, useParams } from 'react-router-dom';
import type { SessionSummaryDto } from '@/features/session/api/session-complete-api';
import { SessionSummaryView } from '@/features/session/ui/SessionSummaryView';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';

type SummaryLocationState = {
  summary?: SessionSummaryDto;
};

export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SummaryLocationState | null;
  const summary = state?.summary;

  if (!summary || summary.sessionId !== sessionId) {
    return (
      <AppShell title="Итог">
        <PageMeta title="Итог сессии — Quest Fitness" robots="noindex,nofollow" />
        <PageState
          status="notFound"
          message="Нет данных итога. Вернитесь в пул и откройте сессию снова."
          action={
            <Button variant="secondary" onClick={() => navigate('/pool')}>
              К пулу
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      bottom={
        <BottomCta
          primary={
            <Button variant="primary" fullWidth onClick={() => navigate('/pool')}>
              К пулу
            </Button>
          }
        />
      }
    >
      <PageMeta title="Итог сессии — Quest Fitness" robots="noindex,nofollow" />
      <SessionSummaryView summary={summary} />
    </AppShell>
  );
}
