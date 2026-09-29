import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SESSION_KEY = 'requireSession';

/** Маршрут требует валидную серверную сессию (cookie qf_session). */
export const RequireSession = () => SetMetadata(REQUIRE_SESSION_KEY, true);
