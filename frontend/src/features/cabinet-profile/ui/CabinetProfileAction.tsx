import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageState } from '@/shared/ui/PageState';
import { LogoutIcon } from '@/shared/ui/icons';

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; errorCode: string | null }
  | { status: 'ready'; login: string };

/** Линейная иконка «человек» 24px, штрих 1.5 — в kit такой пока нет. */
function ProfileIcon() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </svg>
  );
}

/**
 * Кнопка «Профиль» в шапке кабинета + шторка: логин и «Выйти».
 * Смены пароля клиентом в API нет — её в шторке нет (пароль сбрасывает тренер).
 */
export function CabinetProfileAction() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({ status: 'loading' });

  async function loadProfile() {
    setProfile({ status: 'loading' });
    const { data, error } = await apiClient.GET('/api/auth/me');
    if (error || !data) {
      setProfile({ status: 'error', errorCode: error?.error?.code ?? null });
      return;
    }
    setProfile({ status: 'ready', login: data.login });
  }

  function handleOpen() {
    setOpen(true);
    void loadProfile();
  }

  async function handleLogout() {
    await apiClient.POST('/api/auth/logout');
    setCsrfToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <>
      <IconButton label="Профиль" onClick={handleOpen}>
        <ProfileIcon />
      </IconButton>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Профиль"
        footer={
          <Button variant="ghost" fullWidth onClick={() => void handleLogout()}>
            <LogoutIcon />
            Выйти
          </Button>
        }
      >
        {profile.status === 'loading' ? <PageState status="loading" /> : null}
        {profile.status === 'error' ? (
          <PageState
            status="error"
            errorCode={profile.errorCode}
            onRetry={() => void loadProfile()}
          />
        ) : null}
        {profile.status === 'ready' ? (
          <ListCard label="Учётная запись">
            <ListRow title={profile.login} meta="Логин для входа" metaPlacement="below" />
          </ListCard>
        ) : null}
      </BottomSheet>
    </>
  );
}
