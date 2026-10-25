import type { ReactNode } from 'react';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import {
  DumbbellIcon,
  LayersIcon,
  ListIcon,
  LogoutIcon,
  RepeatIcon,
  ShieldIcon,
  UsersIcon,
} from '@/shared/ui/icons';
import './TrainerMenuSheet.css';

export type TrainerMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Админ видит «Тренеры» и «Админ-панель». */
  isAdmin?: boolean;
  /** Если задан — внизу шторки ghost-кнопка «Выйти». */
  onLogout?: () => void;
};

type MenuItem = {
  to: string;
  label: string;
  icon: ReactNode;
  meta?: string;
  adminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { to: '/pool', label: 'Пул клиентов', icon: <ListIcon /> },
  { to: '/catalog', label: 'Каталог упражнений', icon: <DumbbellIcon /> },
  { to: '/templates', label: 'Шаблоны тренировки', icon: <LayersIcon /> },
  { to: '/macrocycles', label: 'Макроциклы', icon: <RepeatIcon /> },
  { to: '/admin/trainers', label: 'Тренеры', icon: <UsersIcon />, adminOnly: true },
  { to: '/admin/panel', label: 'Админ-панель', icon: <ShieldIcon />, meta: 'Скоро', adminOnly: true },
];

/** Меню тренера — шторка снизу на всех ширинах (DESIGN → trainer-menu), один уровень. */
export function TrainerMenuSheet({ open, onClose, isAdmin = false, onLogout }: TrainerMenuSheetProps) {
  const visibleItems = MENU_ITEMS.filter((item) => isAdmin || !item.adminOnly);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Разделы зала"
      className="trainer-menu-sheet"
      footer={
        onLogout ? (
          <Button variant="ghost" fullWidth className="trainer-menu-sheet__logout" onClick={onLogout}>
            <LogoutIcon />
            Выйти из аккаунта
          </Button>
        ) : undefined
      }
    >
      <ListCard label="Куда перейти">
        {visibleItems.map((item) => (
          <ListRow
            key={item.to}
            to={item.to}
            onClick={onClose}
            leading={item.icon}
            title={item.label}
            meta={item.meta ? <span className="trainer-menu-sheet__soon">{item.meta}</span> : undefined}
          />
        ))}
      </ListCard>
    </BottomSheet>
  );
}