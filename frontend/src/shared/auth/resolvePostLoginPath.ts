import type { components } from '@/shared/api/schema';

type UserRole = components['schemas']['MeResponseDto']['role'];

/** Маршрут после успешного входа по роли (Story 1.3). */
export function resolvePostLoginPath(role: UserRole): '/pool' | '/cabinet/workouts' {
  if (role === 'CLIENT') {
    return '/cabinet/workouts';
  }
  return '/pool';
}

/** Корневой редирект для авторизованного пользователя. */
export function resolveRootPathForRole(role: UserRole): '/pool' | '/cabinet/workouts' {
  return resolvePostLoginPath(role);
}
