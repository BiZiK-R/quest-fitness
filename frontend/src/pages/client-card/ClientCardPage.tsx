import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type ClientProfile = components['schemas']['ClientProfileDto'];

export function ClientCardPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadClient = useCallback(async () => {
    if (!id) {
      setLoadError('NOT_FOUND');
      return;
    }
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/clients/{id}', {
      params: { path: { id } },
    });
    if (error) {
      setClient(null);
      setLoadError(error.error?.code ?? 'LOAD_FAILED');
      return;
    }
    setClient(data ?? null);
  }, [id]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  return (
    <>
      <PageMeta title="Клиент — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>

      {loadError ? <p role="alert">{loadError}</p> : null}

      {client ? (
        <>
          <h1>{client.displayName}</h1>
          <button type="button" onClick={() => setInviteOpen((v) => !v)}>
            Пригласить
          </button>
          {inviteOpen ? (
            <ClientInvitePanel
              clientId={client.id}
              clientDisplayName={client.displayName}
              onClose={() => setInviteOpen(false)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
