import { apiClient } from './client';
import type { components } from './schema';

export type InviteRegisterPayload = {
  name: string;
  phone: string;
  login: string;
  password: string;
};

type LoginResponse = components['schemas']['LoginResponseDto'];
type ErrorEnvelope = components['schemas']['ErrorEnvelopeDto'];

export async function postInviteRegister(
  token: string,
  body: InviteRegisterPayload,
): Promise<
  | { ok: true; data: LoginResponse }
  | { ok: false; error: ErrorEnvelope }
> {
  const result = await apiClient.POST('/api/invites/{token}/register', {
    params: { path: { token } },
    body,
  });

  if (result.data) {
    return { ok: true, data: result.data };
  }

  if (result.error) {
    return { ok: false, error: result.error as ErrorEnvelope };
  }

  return {
    ok: false,
    error: {
      error: { code: 'INTERNAL_ERROR', message: 'Empty invite register response' },
    },
  };
}
