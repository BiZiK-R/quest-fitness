import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

/** Что дочерняя страница кабинета может поменять в общей шапке CabinetLayout. */
export type CabinetShellOverride = {
  title: string;
  /** Если задан — слева «Назад» на этот путь, справа нет «Профиля». */
  backTo?: string;
};

/** Outlet-контекст CabinetLayout. */
export type CabinetOutletContext = {
  setShellOverride: (override: CabinetShellOverride | null) => void;
};

/**
 * Задаёт title/«Назад» шапки кабинета из дочерней страницы; при уходе со страницы сбрасывает.
 * Вне CabinetLayout (изолированные тесты) ничего не делает.
 */
export function useCabinetShell(title: string, backTo?: string) {
  const context = useOutletContext<CabinetOutletContext | undefined>();
  const setShellOverride = context?.setShellOverride;

  useEffect(() => {
    if (!setShellOverride) {
      return;
    }
    setShellOverride({ title, backTo });
    return () => setShellOverride(null);
  }, [setShellOverride, title, backTo]);
}
