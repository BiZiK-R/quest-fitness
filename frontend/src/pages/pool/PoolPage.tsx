import { useNavigate } from 'react-router-dom';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { PageMeta } from '@/shared/ui/PageMeta';

export function PoolPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    await apiClient.POST('/api/auth/logout');
    setCsrfToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <>
      <PageMeta title="Пул клиентов — Quest Fitness" robots="noindex,nofollow" />
      <h1>Пул клиентов</h1>
      <button type="button" onClick={() => void handleLogout()}>
        Выйти
      </button>
    </>
  );
}
