import 'server-only';

import { toApiError } from './errors';

const API_URL = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/$/, '');

/**
 * Server-side fetch of public data (catalog, content). Responses are cached
 * and revalidated (TZ §22 "Кэширование публичного каталога").
 */
export async function serverApi<T>(path: string, locale: string, revalidate = 60): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${API_URL}/api${path}${separator}locale=${locale}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate, tags: ['catalog'] },
  });
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

/** Like serverApi, but returns null on 404 (for pages that call notFound()). */
export async function serverApiOrNull<T>(
  path: string,
  locale: string,
  revalidate = 60
): Promise<T | null> {
  try {
    return await serverApi<T>(path, locale, revalidate);
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}

/** For optional page sections: an unavailable API must not break the whole page. */
export async function serverApiSafe<T>(
  path: string,
  locale: string,
  fallback: T,
  revalidate = 60
): Promise<T> {
  try {
    return await serverApi<T>(path, locale, revalidate);
  } catch {
    return fallback;
  }
}
