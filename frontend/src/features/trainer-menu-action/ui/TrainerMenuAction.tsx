import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainerMenuSheet } from '@/features/trainer-menu/ui/TrainerMenuSheet';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { IconButton } from '@/shared/ui/IconButton';
import { MenuIcon } from '@/shared/ui/icons';

type TrainerMenuActionProps = {
  /** Показать ghost «Выйти» внизу шторки (Пул клиентов). */
  withLogout?: boolean;
};

/** Кнопка «Меню» для `action` appbar тренера: открывает TrainerMenuSheet, роль берёт из /api/auth/me. */
export function TrainerMenuAction({ withLogout = false }: TrainerMenuActionProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      const { data } = await apiClient.GET('/api/auth/me');
      if (!cancelled && data) {
        setIsAdmin(data.role === 'ADMIN');
      }
    }
    void loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setOpen(false);
    await apiClient.POST('/api/auth/logout');
    setCsrfToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <>
      <IconButton label="Разделы зала" onClick={() => setOpen(true)}>
        <MenuIcon />
      </IconButton>
      <TrainerMenuSheet
        open={open}
        onClose={() => setOpen(false)}
        isAdmin={isAdmin}
        onLogout={withLogout ? () => void handleLogout() : undefined}
      />
    </>
  );
}
