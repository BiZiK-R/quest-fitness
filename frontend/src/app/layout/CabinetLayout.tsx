import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/shared/ui/AppShell';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon } from '@/shared/ui/icons';
import { CabinetProfileAction } from '@/features/cabinet-profile/ui/CabinetProfileAction';
import { CABINET_TABS, resolveCabinetTabId } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';
import { CabinetTabBar } from '@/widgets/cabinet-tab-bar/ui/CabinetTabBar';
import type {
  CabinetOutletContext,
  CabinetShellOverride,
} from '@/widgets/cabinet-shell/model/use-cabinet-shell';

/** Заголовок по умолчанию: лейбл вкладки или «Дневник» — до того, как страница задаст свой. */
function defaultTitleFor(pathname: string): string | undefined {
  const tabId = resolveCabinetTabId(pathname);
  if (tabId) {
    return CABINET_TABS.find((tab) => tab.id === tabId)?.label;
  }
  if (pathname.startsWith('/cabinet/diary')) {
    return 'Дневник';
  }
  return undefined;
}

/**
 * Кабинет клиента: AppShell с tab-bar в закреплённом низу колонки. Маршрут — `handle.ownShell`.
 * Дочерние страницы меняют title / «Назад» через `useCabinetShell`.
 */
export function CabinetLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [shellOverride, setShellOverride] = useState<CabinetShellOverride | null>(null);
  const outletContext = useMemo<CabinetOutletContext>(() => ({ setShellOverride }), []);

  const title = shellOverride?.title ?? defaultTitleFor(pathname);
  const backTo = shellOverride?.backTo;

  const leading = backTo ? (
    <IconButton label="Назад" onClick={() => navigate(backTo)}>
      <BackIcon />
    </IconButton>
  ) : undefined;

  return (
    <AppShell
      title={title}
      leading={leading}
      action={backTo ? undefined : <CabinetProfileAction />}
      bottom={<CabinetTabBar />}
    >
      <Outlet context={outletContext} />
    </AppShell>
  );
}
