import { useParams } from 'react-router-dom';
import { DiaryListPage } from '@/pages/diary/DiaryListPage';

export function TrainerClientDiaryPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const safeClientId = clientId ?? '';

  return (
    <DiaryListPage
      clientId={safeClientId}
      backTo={`/clients/${safeClientId}`}
      backLabel="← Карточка клиента"
      sessionDetailPath={(sessionId) => `/clients/${safeClientId}/diary/${sessionId}`}
    />
  );
}
