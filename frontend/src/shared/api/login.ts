import { apiClient } from './client';
import type { components } from './schema';

export type TrainerLoginCredentials = {
  login: string;
  password: string;
};

type LoginResponse = components['schemas']['LoginResponseDto'];
type ErrorEnvelope = components['schemas']['ErrorEnvelopeDto'];

/** Trainer/admin login against BFF. */
export async function postTrainerLogin(
  credentials: TrainerLoginCredentials,
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
