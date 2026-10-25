import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { IconButton } from '@/shared/ui/IconButton';
import { MenuIcon } from '@/shared/ui/icons';
import { TrainerMenuSheet } from './TrainerMenuSheet';

type TrainerMenuButtonProps = {
  isAdmin: boolean;
};

/** IconButton «Меню» для `action` AppShell: открывает TrainerMenuSheet, «Выйти» живёт в шторке. */
export function TrainerMenuButton({ isAdmin }: TrainerMenuButtonProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
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
        onLogout={() => void handleLogout()}
      />
    </>
  );
}
