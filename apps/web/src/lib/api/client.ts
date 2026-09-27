import type { Session } from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** Server-side renders may reach the API over an internal network. */
export const SERVER_API_URL = (process.env.API_INTERNAL_URL || API_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Skip the Authorization header even if signed in. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

/**
 * Hooks the auth store installs so this module stays framework-agnostic
 * and importable from server components.
 */
interface AuthBridge {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  onRefreshed(session: Omit<Session, 'user'>): void;
  onUnauthorized(): void;
}

let auth: AuthBridge | null = null;
export function installAuthBridge(bridge: AuthBridge) {
  auth = bridge;
}

export function buildUrl(base: string, path: string, query?: Query) {
  const url = new URL(base + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function parse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toError(status: number, body: unknown): ApiError {
  const b = (body ?? {}) as { detail?: unknown; message?: unknown; errors?: Record<string, string[]> };
  const message =
    typeof b.detail === 'string'
      ? b.detail
      : typeof b.message === 'string'
        ? b.message
        : status === 0
          ? 'Could not reach Klix. Check your connection.'
          : `Request failed (${status})`;
  return new ApiError(status, message, b.errors, body);
}

// Many requests can 401 at once when the access token expires; they all
// wait on a single refresh instead of each spending the refresh token.
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = auth?.getRefreshToken();
  if (!refreshToken) return false;

  refreshing ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      auth?.onRefreshed(await response.json());
      return true;
    } catch {
      return false;
    } finally {
      queueMicrotask(() => {
        refreshing = null;
      });
    }
  })();

  return refreshing;
}

export async function api<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const token = options.anonymous ? null : auth?.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(API_URL, path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw toError(0, null);
  }

  if (response.status === 401 && token && !retried) {
    if (await refreshSession()) return api<T>(path, options, true);
    auth?.onUnauthorized();
  }

  const body = await parse(response);
  if (!response.ok) throw toError(response.status, body);
  return body as T;
}

/** Fetch for server components: public data only, with ISR caching. */
export async function serverApi<T>(path: string, { query, revalidate = 30 }: { query?: Query; revalidate?: number } = {}) {
  const response = await fetch(buildUrl(SERVER_API_URL, path, query), {
    headers: { Accept: 'application/json' },
    next: { revalidate },
  });
  const body = await parse(response);
  if (!response.ok) throw toError(response.status, body);
  return body as T;
}
