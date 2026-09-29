/**
 * Приводит ввод телефона к E.164 (минимально, AD-5).
 * — Если строка начинается с «+», оставляем «+» и только цифры.
 * — Если 10–11 цифр без «+», считаем номер RU и добавляем префикс +7
 *   (11 цифр с ведущей 8 или 7: берём последние 10 как абонентский номер).
 * — Иначе возвращает null (значит идентификатор не телефон).
 */
export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      return null;
    }
    return `+${digits}`;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `+7${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8'))) {
    return `+7${digitsOnly.slice(1)}`;
  }

  return null;
}
