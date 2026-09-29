import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { ClientMacroProgressPanel } from '@/features/client-macro-progress/ui/ClientMacroProgressPanel';
import { ClientWorkoutsOverviewPanel } from '@/features/client-workouts-overview/ui/ClientWorkoutsOverviewPanel';
import { ClientWorkoutSchedulePanel } from '@/features/client-workout-schedule/ui/ClientWorkoutSchedulePanel';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { formatLockCountdown } from '@/shared/lib/format-lock-countdown';
import { useInterval } from '@/shared/lib/use-interval';
import { PageMeta } from '@/shared/ui/PageMeta';

type ClientProfile = components['schemas']['ClientProfileDto'];
type MeResponse = components['schemas']['MeResponseDto'];
type LockStatus = NonNullable<ClientProfile['lockStatus']>;

const LOCK_HEARTBEAT_MS = 55_000;
const COUNTDOWN_TICK_MS = 30_000;

export function ClientCardPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lockActionError, setLockActionError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const isHolderRef = useRef(false);

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

  useEffect(() => {
    void apiClient.GET('/api/auth/me').then(({ data }) => {
      if (data) {
        setMe(data);
      }
    });
  }, []);

  const liveLock: LockStatus | null = useMemo(() => {
    const status = client?.lockStatus ?? null;
    if (!status) {
      return null;
    }
    if (new Date(status.expiresAt).getTime() <= countdownNow) {
      return null;
    }
    return status;
  }, [client?.lockStatus, countdownNow]);

  const isHolder = Boolean(me && liveLock && liveLock.holderTrainerId === me.id);
  const lockedByOther = Boolean(liveLock && me && liveLock.holderTrainerId !== me.id);
  const mutationsDisabled = !isHolder;

  isHolderRef.current = isHolder;

  useInterval(() => {
    setCountdownNow(Date.now());
  }, liveLock ? COUNTDOWN_TICK_MS : null);

  const sendHeartbeat = useCallback(async () => {
    if (!id || !isHolderRef.current) {
      return;
    }
    const { data, error } = await apiClient.POST('/api/clients/{id}/lock/heartbeat', {
      params: { path: { id } },
    });
    if (error || !data) {
      return;
    }
    setClient((prev) =>
      prev
        ? {
            ...prev,
            lockStatus: {
              holderTrainerId: data.holderTrainerId,
              expiresAt: data.expiresAt,
            },
          }
        : prev,
    );
  }, [id]);

  useInterval(() => {
    void sendHeartbeat();
  }, isHolder ? LOCK_HEARTBEAT_MS : null);

  const releaseLockBestEffort = useCallback(async () => {
    if (!id || !isHolderRef.current) {
      return;
    }
    await apiClient.DELETE('/api/clients/{id}/lock', {
      params: { path: { id } },
    });
  }, [id]);

  useEffect(() => {
    return () => {
      void releaseLockBestEffort();
    };
  }, [releaseLockBestEffort]);

  async function handleTakeClient() {
    if (!id) {
      return;
    }
    setLockActionError(null);
    const { data, error } = await apiClient.POST('/api/clients/{id}/lock', {
      params: { path: { id } },
    });
    if (error) {
      setLockActionError(error.error?.code ?? 'LOCK_FAILED');
      await loadClient();
      return;
    }
    if (data) {
      setClient((prev) =>
        prev
          ? {
              ...prev,
              lockStatus: {
                holderTrainerId: data.holderTrainerId,
                expiresAt: data.expiresAt,
              },
            }
          : prev,
      );
    }
  }

  async function handleResetPassword() {
    if (!id) {
      return;
    }
    setResetError(null);
    setTempPassword(null);
    const { data, error } = await apiClient.POST('/api/clients/{id}/reset-password', {
      params: { path: { id } },
    });
    if (error) {
      setResetError(error.error?.code ?? 'RESET_FAILED');
      return;
    }
    if (data?.temporaryPassword) {
      setTempPassword(data.temporaryPassword);
    }
  }

  async function handleReleaseClient() {
    if (!id) {
      return;
    }
    const confirmed = window.confirm(
      'Освободить клиента? Карточка станет доступна другим тренерам.',
    );
    if (!confirmed) {
      return;
    }
    setLockActionError(null);
    const { error } = await apiClient.DELETE('/api/clients/{id}/lock', {
      params: { path: { id } },
    });
    if (error) {
      setLockActionError(error.error?.code ?? 'RELEASE_FAILED');
      return;
    }
    setClient((prev) => (prev ? { ...prev, lockStatus: null } : prev));
    setInviteOpen(false);
  }

  const otherLockCountdown = liveLock
    ? formatLockCountdown(liveLock.expiresAt, countdownNow)
    : null;

  return (
    <>
      <PageMeta title="Клиент — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {lockActionError ? <p role="alert">{lockActionError}</p> : null}
      {resetError ? <p role="alert">{resetError}</p> : null}

      {lockedByOther && liveLock ? (
        <div role="status" className="client-card__lock-banner">
          <p>
            Клиента ведёт {liveLock.holderTrainerId}. Освободится через {otherLockCountdown}.
          </p>
        </div>
      ) : null}

      {client ? (
        <>
          <h1>{client.displayName}</h1>

          <p>
            <Link to={`/clients/${client.id}/diary`}>Дневник</Link>
          </p>

          {!liveLock ? (
            <button type="button" onClick={() => void handleTakeClient()}>
              Взять клиента
            </button>
          ) : null}

          {isHolder ? (
            <button type="button" onClick={() => void handleReleaseClient()}>
              Освободить
            </button>
          ) : null}

          <button
            type="button"
            aria-disabled={mutationsDisabled}
            aria-describedby={lockedByOther ? 'client-lock-banner-desc' : undefined}
            onClick={() => {
              if (mutationsDisabled) {
                return;
              }
              setInviteOpen((v) => !v);
            }}
          >
            Пригласить
          </button>
          {lockedByOther ? (
            <span id="client-lock-banner-desc" className="visually-hidden">
              Доступно после захвата клиента
            </span>
          ) : null}

          {inviteOpen && !mutationsDisabled ? (
            <ClientInvitePanel
              clientId={client.id}
              clientDisplayName={client.displayName}
              onClose={() => setInviteOpen(false)}
            />
          ) : null}

          <ClientWorkoutsOverviewPanel
            clientId={client.id}
            diaryTo={`/clients/${client.id}/diary`}
            compact
          />

          <ClientMacroProgressPanel
            clientId={client.id}
            initialProgress={client.macroProgress}
            mutationsDisabled={mutationsDisabled}
            onProgressChange={(macroProgress) => {
              setClient((prev) => (prev ? { ...prev, macroProgress } : prev));
            }}
          />

          <ClientWorkoutSchedulePanel
            clientId={client.id}
            macroProgress={client.macroProgress}
            mutationsDisabled={mutationsDisabled}
          />

          {me?.role === 'ADMIN' && client.userId ? (
            <>
              <button type="button" onClick={() => void handleResetPassword()}>
                Сбросить пароль
              </button>
              {tempPassword ? (
                <p role="status">
                  Временный пароль (показан один раз): <strong>{tempPassword}</strong>
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}
