import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { useInterval } from '@/shared/lib/use-interval';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { LockBadge } from '@/shared/ui/LockBadge';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SearchIcon } from '@/shared/ui/icons';
import { TextField } from '@/shared/ui/TextField';
import { CreateClientSheet } from './CreateClientSheet';
import { formatNextWorkoutMeta } from './format-next-workout-meta';
import './PoolPage.css';

type ClientProfile = components['schemas']['ClientProfileDto'];

const POOL_POLL_MS = 30_000;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; code: string }
  | { status: 'ready' };

export function PoolPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [createOpen, setCreateOpen] = useState(false);

  const loadClients = useCallback(async () => {
    const { data, error } = await apiClient.GET('/api/clients');
    if (error) {
      setLoadState({ status: 'error', code: error.error?.code ?? 'LOAD_FAILED' });
      return;
    }
    setClients(data?.clients ?? []);
    setLoadState({ status: 'ready' });
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

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

  const isPoolEmpty = loadState.status === 'ready' && clients.length === 0;
  const isSearchMiss =
    loadState.status === 'ready' &&
    !isPoolEmpty &&
    searchQuery.trim() !== '' &&
    filteredClients.length === 0;

  function retryLoad() {
    setLoadState({ status: 'loading' });
    void loadClients();
  }

  function renderContent() {
    if (loadState.status === 'loading') {
      return <PageState status="loading" />;
    }
    if (loadState.status === 'error') {
      return <PageState status="error" errorCode={loadState.code} onRetry={retryLoad} />;
    }
    if (isPoolEmpty) {
      return (
        <EmptyState
          title="Пул пока пуст"
          description="Добавьте первого клиента — он сразу появится в этом списке."
          action={
            <Button variant="primary" fullWidth onClick={() => setCreateOpen(true)}>
              Добавить клиента
            </Button>
          }
        />
      );
    }

    return (
      <>
        <TextField
          id="pool-search"
          name="search"
          variant="search"
          type="search"
          label="Найти клиента по имени"
          hideLabel
          placeholder="Найти клиента по имени"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          leadingIcon={<SearchIcon />}
        />

        {isSearchMiss ? (
          <EmptyState
            size="title"
            title="Никого не нашли"
            description="Сбросьте поиск или добавьте клиента с таким именем."
            action={
              <Button variant="secondary" fullWidth onClick={() => setSearchQuery('')}>
                Очистить поиск
              </Button>
            }
          />
        ) : null}

        {filteredClients.length > 0 ? (
          <ListCard label="Список клиентов в пуле" className="pool-page__list">
            {filteredClients.map((client) => (
              <ListRow
                key={client.id}
                to={`/clients/${client.id}`}
                title={client.displayName}
                meta={
                  client.nextWorkout
                    ? formatNextWorkoutMeta(client.nextWorkout)
                    : 'Нет тренировок'
                }
                metaPlacement="below"
                ariaLabel={`Открыть карточку: ${client.displayName}`}
                badge={
                  client.lockStatus ? (
                    <LockBadge holderName={client.lockStatus.holderDisplayName} />
                  ) : undefined
                }
              />
            ))}
          </ListCard>
        ) : null}
      </>
    );
  }

  /** Пустой пул: CTA только в EmptyState — без второй «Добавить» внизу. */
  const showBottomCta = loadState.status === 'ready' && !isPoolEmpty;

  return (
    <>
      <PageMeta title="Пул клиентов — Quest Fitness" robots="noindex,nofollow" />
      <AppShell
        title="Пул клиентов"
        action={<TrainerMenuAction withLogout />}
        bottom={
          showBottomCta ? (
            <BottomCta
              primary={
                <Button variant="primary" fullWidth onClick={() => setCreateOpen(true)}>
                  Добавить клиента
                </Button>
              }
            />
          ) : undefined
        }
      >
        <div className="pool-page">{renderContent()}</div>
      </AppShell>

      <CreateClientSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void loadClients()}
      />
    </>
  );
}
