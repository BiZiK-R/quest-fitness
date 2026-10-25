import { useParams } from 'react-router-dom';
import { DiaryDetailPage } from '@/pages/diary/DiaryDetailPage';

export function TrainerClientDiaryDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const safeClientId = clientId ?? '';

  return <DiaryDetailPage backTo={`/clients/${safeClientId}/diary`} />;
}
