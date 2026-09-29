import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';

type SetDto = components['schemas']['SetDto'];
type UpsertBody = components['schemas']['UpsertSetRequestDto'];

export type UpsertSessionSetPayload = UpsertBody;

/** Online PUT upsert by client setId (AD-8, AD-14). */
export async function upsertSessionSet(
  sessionId: string,
  setId: string,
  body: UpsertSessionSetPayload,
): Promise<{ data: SetDto | undefined; error: unknown }> {
  const { data, error } = await apiClient.PUT('/api/sessions/{sessionId}/sets/{setId}', {
    params: { path: { sessionId, setId } },
    body,
  });
  return { data, error };
}

/** Deletes a logged set while session is active. */
export async function deleteSessionSet(
  sessionId: string,
  setId: string,
): Promise<{ error: unknown }> {
  const { error } = await apiClient.DELETE('/api/sessions/{sessionId}/sets/{setId}', {
    params: { path: { sessionId, setId } },
  });
  return { error };
}
