/**
 * Русская форма слова по числу: `pluralRu(3, ['подход', 'подхода', 'подходов'])` → 'подхода'.
 * Формы: [1, 2–4, 5–20 и 0].
 */
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(count));
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return forms[2];
  }
  if (last === 1) {
    return forms[0];
  }
  if (last >= 2 && last <= 4) {
    return forms[1];
  }
  return forms[2];
}
