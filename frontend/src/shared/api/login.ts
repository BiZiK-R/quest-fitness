import { apiClient } from './client';
import type { components } from './schema';

export type LoginCredentials = {
  login: string;
  password: string;
};

/** @deprecated use LoginCredentials */
export type TrainerLoginCredentials = LoginCredentials;

type LoginResponse = components['schemas']['LoginResponseDto'];
type ErrorEnvelope = components['schemas']['ErrorEnvelopeDto'];

/** Login (логин или телефон) для любой роли. */
export async function postLogin(
  credentials: LoginCredentials,
): Promise<
  | { ok: true; data: LoginResponse }
  | { ok: false; error: ErrorEnvelope }
> {
  const result = await apiClient.POST('/api/auth/login', {
    body: credentials,
  });

  if (result.data) {
    return { ok: true, data: result.data };
  }

  if (result.error) {
    return { ok: false, error: result.error as ErrorEnvelope };
  }

  return {
    ok: false,
    error: { error: { code: 'INTERNAL_ERROR', message: 'Empty login response' } },
  };
}

/** @deprecated use postLogin */
export const postTrainerLogin = postLogin;
