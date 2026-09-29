import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { PageMeta } from '@/shared/ui/PageMeta';

type ClientProfile = components['schemas']['ClientProfileDto'];

export function PoolPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteClientId, setInviteClientId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/clients');
    if (error) {
      setLoadError(error.error?.code ?? 'LOAD_FAILED');
      return;
    }
    setClients(data?.clients ?? []);
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  async function handleLogout() {
    await apiClient.POST('/api/auth/logout');
    setCsrfToken(null);
    navigate('/login', { replace: true });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      return;
    }

    setCreateError(null);
    setIsSubmitting(true);
    const { error } = await apiClient.POST('/api/clients', {
      body: { displayName: trimmed },
    });
    setIsSubmitting(false);

    if (error) {
      setCreateError(error.error?.code ?? 'CREATE_FAILED');
      return;
    }

    setDisplayName('');
    await loadClients();
  }

  return (
    <>
      <PageMeta title="Пул клиентов — Quest Fitness" robots="noindex,nofollow" />
      <h1>Пул клиентов</h1>

      <form onSubmit={(e) => void handleCreate(e)}>
        <label htmlFor="pool-display-name">Имя клиента</label>
        <input
          id="pool-display-name"
          name="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={128}
          autoComplete="off"
        />
        <button type="submit" disabled={isSubmitting || !displayName.trim()}>
          Добавить в пул
        </button>
        {createError ? <p role="alert">{createError}</p> : null}
      </form>

      {loadError ? <p role="alert">{loadError}</p> : null}

      <ul aria-label="Список клиентов в пуле">
        {clients.map((client) => (
          <li key={client.id}>
            {client.displayName}
            <button
              type="button"
              onClick={() =>
                setInviteClientId((current) =>
                  current === client.id ? null : client.id,
                )
              }
            >
              Пригласить
            </button>
            {inviteClientId === client.id ? (
              <ClientInvitePanel
                clientId={client.id}
                clientDisplayName={client.displayName}
                onClose={() => setInviteClientId(null)}
              />
            ) : null}
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => void handleLogout()}>
        Выйти
      </button>
    </>
  );
}
