import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/** Пропуск глобального CSRF-guard (login, health). */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
