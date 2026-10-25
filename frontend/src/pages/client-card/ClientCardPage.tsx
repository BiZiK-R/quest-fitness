import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { ClientMacroProgressPanel } from '@/features/client-macro-progress/ui/ClientMacroProgressPanel';
import { ClientWorkoutsOverviewPanel } from '@/features/client-workouts-overview/ui/ClientWorkoutsOverviewPanel';
import { ClientWorkoutSchedulePanel } from '@/features/client-workout-schedule/ui/ClientWorkoutSchedulePanel';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { formatLockCountdown } from '@/shared/lib/format-lock-countdown';
import { useInterval } from '@/shared/lib/use-interval';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { LockRow } from '@/shared/ui/LockBadge';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import './ClientCardPage.css';

type ClientProfile = components['schemas']['ClientProfileDto'];
type MeResponse = components['schemas']['MeResponseDto'];
type LockStatus = NonNullable<ClientProfile['lockStatus']>;

const LOCK_HEARTBEAT_MS = 55_000;
const COUNTDOWN_TICK_MS = 30_000;

export function ClientCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lockActionError, setLockActionError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [taking, setTaking] = useState(false);
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
  const canForceRelease = Boolean(isHolder || (me?.role === 'ADMIN' && liveLock));
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
              holderDisplayName: data.holderDisplayName,
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
    setTaking(true);
    const { data, error } = await apiClient.POST('/api/clients/{id}/lock', {
      params: { path: { id } },
    });
    setTaking(false);
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
                holderDisplayName: data.holderDisplayName,
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
    setResetConfirmOpen(false);
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
    setLockActionError(null);
    setReleasing(true);
    const { error } = await apiClient.DELETE('/api/clients/{id}/lock', {
      params: { path: { id } },
    });
    setReleasing(false);
    setReleaseConfirmOpen(false);
    if (error) {
      setLockActionError(error.error?.code ?? 'RELEASE_FAILED');
      return;
    }
    setClient((prev) => (prev ? { ...prev, lockStatus: null } : prev));
    setInviteOpen(false);
  }

  const ttlText = liveLock
    ? `Освободится через ${formatLockCountdown(liveLock.expiresAt, countdownNow)}.`
    : null;

  function renderBody() {
    if (loadError && !client) {
      return (
        <PageState
          status="error"
          errorCode={loadError}
          onRetry={() => {
            setLoadError(null);
            void loadClient();
          }}
        />
      );
    }
    if (!client) {
      return <PageState status="loading" />;
    }

    return (
      <div className="client-card">
        {liveLock ? (
          <LockRow
            id="client-lock-banner"
            holderName={liveLock.holderDisplayName}
            ttlText={ttlText}
            onRelease={canForceRelease ? () => setReleaseConfirmOpen(true) : undefined}
            releasing={releasing}
          />
        ) : null}

        {lockActionError ? (
          <p className="type-meta client-card__error" role="alert">
            {errorMessageFor(lockActionError)}
          </p>
        ) : null}

        {lockedByOther ? (
          <p id="client-lock-hint" className="type-meta type-muted" role="status">
            Правки недоступны, пока клиента ведёт другой тренер.
          </p>
        ) : null}

        {!isHolder && !lockedByOther ? (
          <p id="client-take-hint" className="type-meta client-card__take-hint" role="status">
            Нажмите «Взять клиента» внизу — откроются расписание, программа и приглашение.
          </p>
        ) : null}

        {isHolder ? (
          <p className="type-meta type-muted" role="status">
            Дальше: назначьте тренировку. Программа — по желанию.
          </p>
        ) : null}

        <ClientWorkoutsOverviewPanel
          clientId={client.id}
          diaryTo={`/clients/${client.id}/diary`}
          compact
          mutationsDisabled={mutationsDisabled}
        />

        <SectionTitle>Расписание</SectionTitle>
        <ClientWorkoutSchedulePanel
          clientId={client.id}
          macroProgress={client.macroProgress}
          mutationsDisabled={mutationsDisabled}
        />

        {isHolder || client.macroProgress ? (
          <>
            <SectionTitle>Программа</SectionTitle>
            <ClientMacroProgressPanel
              clientId={client.id}
              initialProgress={client.macroProgress}
              mutationsDisabled={mutationsDisabled}
              onProgressChange={(macroProgress) => {
                setClient((prev) => (prev ? { ...prev, macroProgress } : prev));
              }}
            />
          </>
        ) : null}

        <SectionTitle>Ещё</SectionTitle>
        <ListCard>
          <ListRow
            to={`/clients/${client.id}/diary`}
            title="Дневник"
            meta="История тренировок"
          />
        </ListCard>

        <div className="client-card__access">
          <Button
            variant="secondary"
            fullWidth
            disabled={mutationsDisabled}
            aria-describedby={
              lockedByOther
                ? 'client-lock-hint'
                : mutationsDisabled
                  ? 'client-take-hint'
                  : undefined
            }
            onClick={() => setInviteOpen(true)}
          >
            Пригласить в кабинет
          </Button>
          {me?.role === 'ADMIN' && client.userId ? (
            <Button variant="secondary" fullWidth onClick={() => setResetConfirmOpen(true)}>
              Сбросить пароль
            </Button>
          ) : null}
          {resetError ? (
            <p className="type-meta client-card__error" role="alert">
              {errorMessageFor(resetError)}
            </p>
          ) : null}
          {tempPassword ? (
            <div className="client-card__temp-password" role="status">
              <p className="type-meta type-muted">Временный пароль (один раз):</p>
              <p className="type-title">{tempPassword}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const showTakeCta = Boolean(client && !liveLock);

  return (
    <>
      <PageMeta
        title={client ? `${client.displayName} — Quest Fitness` : 'Клиент — Quest Fitness'}
        robots="noindex,nofollow"
      />
      <AppShell
        title={client?.displayName ?? 'Клиент'}
        leading={
          <IconButton label="Назад" onClick={() => navigate('/pool')}>
            <BackIcon />
          </IconButton>
        }
        action={<TrainerMenuAction />}
        bottom={
          showTakeCta ? (
            <BottomCta
              primary={
                <Button
                  variant="primary"
                  fullWidth
                  loading={taking}
                  onClick={() => void handleTakeClient()}
                >
                  Взять клиента
                </Button>
              }
            />
          ) : undefined
        }
      >
        {renderBody()}
      </AppShell>

      <BottomSheet
        open={inviteOpen && Boolean(client) && !mutationsDisabled}
        onClose={() => setInviteOpen(false)}
        title="Ссылка-приглашение"
      >
        {client ? (
          <ClientInvitePanel
            clientId={client.id}
            clientDisplayName={client.displayName}
            onDone={() => setInviteOpen(false)}
          />
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        open={releaseConfirmOpen}
        title="Освободить клиента?"
        body="Карточка станет доступна другим тренерам."
        confirmLabel="Освободить"
        confirmVariant="danger"
        onConfirm={() => void handleReleaseClient()}
        onCancel={() => setReleaseConfirmOpen(false)}
        busy={releasing}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Сбросить пароль?"
        body="Клиент получит временный пароль. Старый перестанет работать."
        confirmLabel="Сбросить"
        confirmVariant="danger"
        onConfirm={() => void handleResetPassword()}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </>
  );
}
