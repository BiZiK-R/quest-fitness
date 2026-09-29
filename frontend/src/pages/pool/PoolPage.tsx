import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrainerMenuSheet } from '@/features/trainer-menu/ui/TrainerMenuSheet';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { useInterval } from '@/shared/lib/use-interval';
import { PageMeta } from '@/shared/ui/PageMeta';
import { ClientRow } from '@/widgets/client-row/ui/ClientRow';

type ClientProfile = components['schemas']['ClientProfileDto'];
type MeResponse = components['schemas']['MeResponseDto'];

const POOL_POLL_MS = 30_000;

export function PoolPage() {
  const navigate = useNavigate();
  const createInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteClientId, setInviteClientId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

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

  useEffect(() => {
    void apiClient.GET('/api/auth/me').then(({ data }) => {
      if (data) {
        setMe(data);
      }
    });
  }, []);

  useInterval(() => {
    void loadClients();
  }, POOL_POLL_MS);

  useEffect(() => {
    function onFocus() {
      void loadClients();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return clients;
    }
    return clients.filter((c) => c.displayName.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  const isPoolEmpty = clients.length === 0;
  const isSearchMiss =
    !isPoolEmpty && searchQuery.trim() !== '' && filteredClients.length === 0;

  function focusCreateForm() {
    setShowCreateForm(true);
    requestAnimationFrame(() => {
      createInputRef.current?.focus();
    });
  }

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
      <div className="pool-page__toolbar">
        <h1>Пул клиентов</h1>
        {me?.role === 'ADMIN' ? (
          <Link to="/admin/trainers">Тренеры</Link>
        ) : null}
        <button type="button" onClick={() => setMenuOpen(true)}>
          Меню
        </button>
      </div>

      <TrainerMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        showAdminTrainersLink={me?.role === 'ADMIN'}
      />

      <label htmlFor="pool-search">Поиск клиента</label>
      <input
        id="pool-search"
        name="search"
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoComplete="off"
      />

      {isPoolEmpty ? (
        <div className="pool-page__empty">
          <p>Гильдия пока собирается</p>
          <button type="button" className="button-primary" onClick={focusCreateForm}>
            Добавить клиента
          </button>
        </div>
      ) : null}

      {isSearchMiss ? <p>Никого не нашли</p> : null}

      {showCreateForm ? (
        <form onSubmit={(e) => void handleCreate(e)}>
          <label htmlFor="pool-display-name">Имя клиента</label>
          <input
            ref={createInputRef}
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
      ) : null}

      {loadError ? <p role="alert">{loadError}</p> : null}

      <ul aria-label="Список клиентов в пуле" className="pool-page__list">
        {filteredClients.map((client) => (
          <li key={client.id} className="pool-page__list-item">
            <ClientRow
              id={client.id}
              displayName={client.displayName}
              lockHolderLabel={
                client.lockStatus
                  ? `Занят: ${client.lockStatus.holderTrainerId}`
                  : null
              }
            />
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
