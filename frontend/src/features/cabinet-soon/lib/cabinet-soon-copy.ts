/** Verbatim soon-stub copy from epics Story 6.3 — do not paraphrase. */

export type CabinetSoonStubCopy = {
  title: string;
  line: string;
  metaTitle: string;
};

export const CABINET_SOON_STUBS = {
  analytics: {
    title: 'Свиток аналитики',
    line: 'Ещё не развёрнут — раздел появится следом',
    metaTitle: 'Аналитика — Quest Fitness',
  },
  nutrition: {
    title: 'Стол Гильдии',
    line: 'Накрывают к пиру — учёт еды появится следом',
    metaTitle: 'Питание — Quest Fitness',
  },
  measurements: {
    title: 'Лента мерок',
    line: 'Пока пуста — замеры появятся следом',
    metaTitle: 'Замеры — Quest Fitness',
  },
  achievements: {
    title: 'Витрина наград',
    line: 'Ещё собирается — раздел появится следом',
    metaTitle: 'Ачивки — Quest Fitness',
  },
  membership: {
    title: 'Карта пропуска',
    line: 'Ещё не выписана — абонемент появится следом',
    metaTitle: 'Абонемент — Quest Fitness',
  },
} as const satisfies Record<string, CabinetSoonStubCopy>;

export const TRAINER_ADMIN_PANEL_SOON_STUB: CabinetSoonStubCopy = {
  title: 'Кузница правил',
  line: 'Ещё не разожжена — раздел появится следом',
  metaTitle: 'Админ-панель — Quest Fitness',
};
