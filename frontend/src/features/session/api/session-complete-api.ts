import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';

export type SessionSummaryDto = components['schemas']['SessionSummaryDto'];

/** Completes an active session and returns tonnage summary (Story 5.5). */
export async function completeSession(
  sessionId: string,
): Promise<{ data: SessionSummaryDto | undefined; error: unknown }> {
  const { data, error } = await apiClient.POST('/api/sessions/{id}/complete', {
    params: { path: { id: sessionId } },
  });
  return { data, error };
}
