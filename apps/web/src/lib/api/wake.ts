import { ApiError } from './errors';

/**
 * The API host on a free plan falls asleep and needs up to two minutes to
 * start, longer than one request through the website can wait. These helpers
 * wait for it instead of showing «no connection to the server».
 */

/** Asks until the API answers; true when it does, false after `maxMs`. */
export async function waitForApi(maxMs = 150_000): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    try {
      const response = await fetch('/api/health/live', { cache: 'no-store' });
      if (response.ok) return true;
    } catch {
      // not reachable yet
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return false;
}

const unreachable = (error: unknown) =>
  (error instanceof ApiError && error.code === 'NETWORK') || error instanceof TypeError;

/**
 * Runs a request; when the API could not be reached (the request was not
 * processed), waits for it to start and runs the request once more.
 */
export async function withWakeRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!unreachable(error) || !(await waitForApi())) throw error;
    return request();
  }
}
