import { describe, expect, it, vi } from 'vitest';
import { apiFetch } from './client';

describe('apiClient fetch defaults', () => {
  it('uses credentials same-origin on every request', async () => {
    const underlying = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
        new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', underlying);

    await apiFetch('/api/health', { method: 'GET' });

    expect(underlying).toHaveBeenCalledOnce();
    const init = underlying.mock.calls[0]?.[1];
    expect(init?.credentials).toBe('same-origin');

    vi.unstubAllGlobals();
  });
});
