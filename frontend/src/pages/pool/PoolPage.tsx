import { useNavigate } from 'react-router-dom';
import { apiClient, setCsrfToken } from '@/shared/api/client';

export function PoolPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    await apiClient.POST('/api/auth/logout');
    setCsrfToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <main>
      <h1>Пул клиентов</h1>
      <button type="button" onClick={() => void handleLogout()}>
        Выйти
      </button>
    </main>
  );
}
