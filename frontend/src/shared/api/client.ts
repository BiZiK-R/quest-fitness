import createClient from 'openapi-fetch';
import type { paths } from './schema';

/** Same-origin BFF client; nginx/vite proxy `/api` to backend. */
export const apiClient = createClient<paths>({ baseUrl: '' });
