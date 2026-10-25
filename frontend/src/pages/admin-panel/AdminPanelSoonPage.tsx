import { useNavigate } from 'react-router-dom';
import { TRAINER_ADMIN_PANEL_SOON_STUB } from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { CabinetSoonStub } from '@/features/cabinet-soon/ui/CabinetSoonStub';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { AppShell } from '@/shared/ui/AppShell';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';

export function AdminPanelSoonPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      title="Админ-панель"
      leading={
        <IconButton label="Назад" onClick={() => navigate('/pool')}>
          <BackIcon />
        </IconButton>
      }
      action={<TrainerMenuAction />}
    >
      <CabinetSoonStub {...TRAINER_ADMIN_PANEL_SOON_STUB} headingLevel={2} />
    </AppShell>
  );
}
