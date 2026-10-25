import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { TextField } from '@/shared/ui/TextField';
import { PasswordField } from '@/features/password-field/ui/PasswordField';

type StaffUser = components['schemas']['StaffUserDto'];

const CREATE_FORM_ID = 'admin-create-trainer-form';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; code: string }
  | { status: 'ready' };

export function AdminTrainersPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<StaffUser[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [createOpen, setCreateOpen] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<StaffUser | null>(null);
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const loadTrainers = useCallback(async () => {
    const { data, error } = await apiClient.GET('/api/admin/trainers');
    if (error) {
      setTrainers([]);
      setLoadState({ status: 'error', code: error.error?.code ?? 'LOAD_FAILED' });
      return;
    }
    setTrainers(data?.trainers ?? []);
    setLoadState({ status: 'ready' });
  }, []);

  useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loginTrimmed = login.trim();
    if (!loginTrimmed || !password) {
      setFormError('Впишите логин и пароль.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await apiClient.POST('/api/admin/trainers', {
      body: { login: loginTrimmed, password },
    });
    setIsSubmitting(false);
    if (error) {
      setFormError(errorMessageFor(error.error?.code ?? 'CREATE_FAILED'));
      return;
    }
    setLogin('');
    setPassword('');
    setCreateOpen(false);
    await loadTrainers();
  }

  async function handlePromote() {
    if (!promoteTarget) {
      return;
    }
    setPromoteError(null);
    setPromoteBusy(true);
    const { error } = await apiClient.POST('/api/admin/trainers/{id}/promote', {
      params: { path: { id: promoteTarget.id } },
    });
    setPromoteBusy(false);
    if (error) {
      setPromoteError(errorMessageFor(error.error?.code ?? 'PROMOTE_FAILED'));
      return;
    }
    setPromoteTarget(null);
    await loadTrainers();
  }

  function renderContent() {
    if (loadState.status === 'loading') {
      return <PageState status="loading" />;
    }
    if (loadState.status === 'error') {
      return (
        <PageState
          status="error"
          errorCode={loadState.code}
          onRetry={() => {
            setLoadState({ status: 'loading' });
            void loadTrainers();
          }}
        />
      );
    }
    if (trainers.length === 0) {
      return (
        <EmptyState
          title="В Гильдии пока один тренер"
          description="Добавьте коллегу — он появится в пуле тренеров."
        />
      );
    }
    return (
      <ListCard label="Тренеры зала">
        {trainers.map((trainer) => (
          <ListRow
            key={trainer.id}
            title={trainer.login}
            meta={trainer.role === 'ADMIN' ? 'Админ' : 'Тренер'}
            onClick={
              trainer.role === 'TRAINER' ? () => setPromoteTarget(trainer) : undefined
            }
          />
        ))}
      </ListCard>
    );
  }

  return (
    <>
      <PageMeta title="Тренеры — Quest Fitness" robots="noindex,nofollow" />
      <AppShell
        title="Тренеры"
        leading={
          <IconButton label="Назад" onClick={() => navigate('/pool')}>
            <BackIcon />
          </IconButton>
        }
        action={<TrainerMenuAction />}
        bottom={
          <BottomCta
            primary={
              <Button variant="primary" fullWidth onClick={() => setCreateOpen(true)}>
                Добавить тренера
              </Button>
            }
          />
        }
      >
        {promoteError ? (
          <p className="type-meta" role="alert" style={{ color: 'var(--color-ink-error)' }}>
            {promoteError}
          </p>
        ) : null}
        {renderContent()}
      </AppShell>

      <BottomSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый тренер"
        footer={
          <Button
            type="submit"
            form={CREATE_FORM_ID}
            variant="primary"
            fullWidth
            loading={isSubmitting}
          >
            Создать
          </Button>
        }
      >
        <form id={CREATE_FORM_ID} noValidate onSubmit={(e) => void handleCreate(e)}>
          <TextField
            id="trainer-login"
            name="login"
            label="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="off"
          />
          <PasswordField
            id="trainer-password"
            name="password"
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            error={formError}
          />
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={Boolean(promoteTarget)}
        title="Сделать админом?"
        body={
          promoteTarget
            ? `${promoteTarget.login} получит права администратора.`
            : undefined
        }
        confirmLabel="Сделать админом"
        onConfirm={() => void handlePromote()}
        onCancel={() => setPromoteTarget(null)}
        busy={promoteBusy}
      />
    </>
  );
}
