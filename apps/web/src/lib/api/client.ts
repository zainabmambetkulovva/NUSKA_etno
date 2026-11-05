'use client';

import { ApiError, toApiError } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  locale?: string;
  /** Internal: prevents an endless refresh loop. */
  retried?: boolean;
}

let refreshing: Promise<boolean> | null = null;

/** Exchanges the refresh cookie for new tokens. Concurrent 401s share one refresh request. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  return refreshing;
}

/**
 * Browser-side API call through the same-origin `/api` proxy. Auth cookies are
 * httpOnly and sent automatically; on 401 the session is refreshed once.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.locale) headers['X-Locale'] = options.locale;
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body:
      options.body === undefined
        ? undefined
        : isForm
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  if (response.status === 401 && !options.retried && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, { ...options, retried: true });
  }
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export { ApiError };
