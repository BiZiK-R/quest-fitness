import { useMatches } from 'react-router-dom';
import type { AppShellSurface } from '@/shared/ui/AppShell';

/**
 * `handle` маршрута для ShellLayout. Более глубокий маршрут перекрывает родителя.
 * - `title` — заголовок appbar для статичных экранов;
 * - `surface` — 'session' для угольной live-Сессии;
 * - `ownShell` — страница/лейаут сам рендерит `<AppShell>` (нужны action / bottom / динамический title).
 */
export type ShellHandle = {
  title?: string;
  surface?: AppShellSurface;
  ownShell?: boolean;
};

function isShellHandle(value: unknown): value is ShellHandle {
  return typeof value === 'object' && value !== null;
}

/** Слитый `handle` всех совпавших маршрутов (глубже — главнее). */
export function useShellHandle(): ShellHandle {
  const matches = useMatches();
  return matches.reduce<ShellHandle>(
    (merged, match) => (isShellHandle(match.handle) ? { ...merged, ...match.handle } : merged),
    {},
  );
}
