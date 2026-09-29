export type SetSyncState = 'saved' | 'saving' | 'retry';

/** User-facing sync indicator label (Story 5.2). */
export function setSyncIndicatorLabel(state: SetSyncState): string {
  switch (state) {
    case 'saved':
      return 'сохранено';
    case 'saving':
      return 'сохраняется';
    case 'retry':
      return 'не сохранилось, повторить';
  }
}
