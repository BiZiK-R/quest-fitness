import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

const CSRF_COOKIE_NAME = 'qf_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

let csrfTokenInMemory: string | null = null;

/** Stores CSRF token from login response for subsequent mutating requests. */
export function setCsrfToken(token: string | null): void {
  csrfTokenInMemory = token;
}

/** Reads CSRF from memory or readable double-submit cookie. */
export function getCsrfToken(): string | null {
  if (csrfTokenInMemory) {
    return csrfTokenInMemory;
  }
  return readCookie(CSRF_COOKIE_NAME);
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/** Attaches CSRF header when token is available (mutations except login). */
export function attachCsrfHeader(headers: Headers, schemaPath: string, method: string): void {
  const upperMethod = method.toUpperCase();
  if (upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS') {
    return;
  }
  if (schemaPath === '/api/auth/login') {
    return;
  }
  const token = getCsrfToken();
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }
}

/** Same-origin fetch wrapper used by the OpenAPI client. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: 'same-origin' });
}

const csrfMiddleware: Middleware = {
  onRequest({ request, schemaPath }) {
    const headers = new Headers(request.headers);
    const before = headers.get(CSRF_HEADER_NAME);
    attachCsrfHeader(headers, schemaPath, request.method);
    const after = headers.get(CSRF_HEADER_NAME);
    if (before === after && !after) {
      return undefined;
    }
    return new Request(request, { headers });
  },
};

/** Same-origin BFF client; nginx/vite proxy `/api` to backend. */
export const apiClient = createClient<paths>({
  baseUrl: '',
  credentials: 'same-origin',
  fetch: apiFetch,
});

apiClient.use(csrfMiddleware);
