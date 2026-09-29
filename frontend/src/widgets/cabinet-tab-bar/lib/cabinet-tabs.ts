export const CABINET_TAB_LABELS = [
  'Тренировки',
  'Аналитика',
  'Питание',
  'Замеры',
  'Ачивки',
  'Абонемент',
] as const;

export type CabinetTabId =
  | 'workouts'
  | 'analytics'
  | 'nutrition'
  | 'measurements'
  | 'achievements'
  | 'membership';

export type CabinetTabConfig = {
  id: CabinetTabId;
  label: (typeof CABINET_TAB_LABELS)[number];
  to: `/cabinet/${CabinetTabId}`;
  stage: 1 | 2;
};

export const CABINET_TABS: CabinetTabConfig[] = [
  { id: 'workouts', label: 'Тренировки', to: '/cabinet/workouts', stage: 1 },
  { id: 'analytics', label: 'Аналитика', to: '/cabinet/analytics', stage: 2 },
  { id: 'nutrition', label: 'Питание', to: '/cabinet/nutrition', stage: 2 },
  { id: 'measurements', label: 'Замеры', to: '/cabinet/measurements', stage: 2 },
  { id: 'achievements', label: 'Ачивки', to: '/cabinet/achievements', stage: 2 },
  { id: 'membership', label: 'Абонемент', to: '/cabinet/membership', stage: 2 },
];

/** Maps pathname to active cabinet tab (diary routes keep Workouts context out of tab active state). */
export function resolveCabinetTabId(pathname: string): CabinetTabId | null {
  const match = pathname.match(/^\/cabinet\/([^/]+)/);
  if (!match) {
    return null;
  }
  const segment = match[1];
  const tab = CABINET_TABS.find((item) => item.id === segment);
  return tab?.id ?? null;
}
