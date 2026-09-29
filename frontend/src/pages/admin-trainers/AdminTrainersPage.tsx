import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type StaffUser = components['schemas']['StaffUserDto'];

export function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<StaffUser[]>([]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTrainers = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/admin/trainers');
    if (error) {
      setTrainers([]);
      setLoadError(error.error?.code ?? 'LOAD_FAILED');
      return;
    }
    setTrainers(data?.trainers ?? []);
  }, []);

  useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loginTrimmed = login.trim();
    if (!loginTrimmed || !password) {
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await apiClient.POST('/api/admin/trainers', {
      body: { login: loginTrimmed, password },
    });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.error?.code ?? 'CREATE_FAILED');
      return;
    }
    setLogin('');
    setPassword('');
    await loadTrainers();
  }

  async function handlePromote(userId: string) {
    setPromoteError(null);
    const { error } = await apiClient.POST('/api/admin/trainers/{id}/promote', {
      params: { path: { id: userId } },
    });
    if (error) {
      setPromoteError(error.error?.code ?? 'PROMOTE_FAILED');
      return;
    }
    await loadTrainers();
  }

  return (
    <>
      <PageMeta title="Тренеры — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>
      <h1>Тренеры</h1>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {promoteError ? <p role="alert">{promoteError}</p> : null}

      <form onSubmit={(e) => void handleCreate(e)}>
        <h2>Новый тренер</h2>
        <label htmlFor="trainer-login">Логин</label>
        <input
          id="trainer-login"
          name="login"
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="off"
          maxLength={32}
        />
        <label htmlFor="trainer-password">Пароль</label>
        <input
          id="trainer-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
        />
        <button type="submit" disabled={isSubmitting || !login.trim() || password.length < 8}>
          Создать тренера
        </button>
        {formError ? <p role="alert">{formError}</p> : null}
      </form>

      <ul aria-label="Список тренеров и админов">
        {trainers.map((row) => (
          <li key={row.id}>
            {row.login} ({row.role})
            {row.role === 'TRAINER' ? (
              <button type="button" onClick={() => void handlePromote(row.id)}>
                Сделать админом
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
