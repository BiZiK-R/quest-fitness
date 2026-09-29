import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';

export type SetModifierDto = components['schemas']['SetModifierDto'];

export async function listModifiers(): Promise<{
  data: SetModifierDto[] | null;
  error: unknown;
}> {
  const { data, error } = await apiClient.GET('/api/modifiers');
  if (error || !data) {
    return { data: null, error };
  }
  return { data: data.modifiers ?? [], error: null };
}

export async function createModifier(body: {
  name: string;
  colorToken: string;
}): Promise<{ data: SetModifierDto | null; error: unknown }> {
  const { data, error } = await apiClient.POST('/api/modifiers', { body });
  if (error || !data) {
    return { data: null, error };
  }
  return { data, error: null };
}
