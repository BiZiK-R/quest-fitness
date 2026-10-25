const DEFAULT_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.';

/** Человеческие фразы для кодов API (EXPERIENCE → Voice and Tone: без «ошибка 500» и канцелярита). */
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: 'Вход истёк. Войдите снова.',
  VALIDATION_FAILED: 'Проверьте поля — что-то заполнено не так.',
  LOCK_REQUIRED: 'Клиент не закреплён за вами. Откройте карточку заново.',
  CLIENT_LOCKED: 'Клиента ведёт другой тренер. Правка откроется, когда он освободится.',
  INVITE_EXPIRED: 'Ссылка истекла. Попросите тренера выслать новую.',
  INVITE_ALREADY_CONSUMED: 'По этой ссылке уже зарегистрировались. Войдите со своим логином.',
  LOAD_FAILED: 'Не загрузилось. Проверьте сеть.',
  CREATE_FAILED: 'Не сохранилось.',
  FORBIDDEN_ROLE: 'Этот раздел недоступен для вашей роли.',
  NOT_FOUND: 'Не нашли — возможно, запись удалили.',
  SESSION_LOAD_FAILED: 'Сессия не открылась. Проверьте сеть и попробуйте снова.',
  SESSION_COMPLETE_FAILED: 'Не удалось завершить сессию. Попробуйте ещё раз.',
  CLIENT_PROFILE_MISSING: 'Профиль клиента не найден. Обратитесь к тренеру.',
  ME_LOAD_FAILED: 'Не удалось открыть профиль. Попробуйте ещё раз.',
  OVERVIEW_LOAD_FAILED: 'Обзор не загрузился. Проверьте сеть.',
};

/**
 * Код ошибки API (`error.error.code`) → короткая русская фраза для инлайн-строки / PageState.
 * Неизвестный или пустой код → нейтральная фраза, а не сам код.
 */
export function errorMessageFor(code: string | null | undefined): string {
  if (!code) {
    return DEFAULT_MESSAGE;
  }
  return MESSAGES[code] ?? DEFAULT_MESSAGE;
}
