import 'server-only';

import { toApiError } from './errors';

const API_URL = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/$/, '');
/** Gateway answers while the API host is waking up. */
const WAKING = new Set([502, 503, 504]);

/**
 * Server-side fetch of public data (catalog, content). Responses are cached
 * and revalidated (TZ §22 "Кэширование публичного каталога").
 */
export async function serverApi<T>(path: string, locale: string, revalidate = 60): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const request = () =>
    fetch(`${API_URL}/api${path}${separator}locale=${locale}`, {
      headers: {
        Accept: 'application/json',
        ...(process.env.API_PROXY_SECRET ? { 'x-proxy-secret': process.env.API_PROXY_SECRET } : {}),
      },
      next: { revalidate, tags: ['catalog'] },
    });
  let response: Response;
  try {
    response = await request();
  } catch {
    // a dropped keep-alive connection: one more try on a fresh one
    await new Promise((resolve) => setTimeout(resolve, 250));
    response = await request();
  }
  if (WAKING.has(response.status)) {
    // the API host was asleep (free plan) and is starting: try once more
    await new Promise((resolve) => setTimeout(resolve, 2000));
    response = await request();
  }
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
