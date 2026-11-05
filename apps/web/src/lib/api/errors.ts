import type { ApiErrorBody } from '@nuska/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly body: ApiErrorBody | null
  ) {
    super(code);
    this.name = 'ApiError';
  }

  /** Field-level validation messages, keyed by field path. */
  get fieldErrors(): Record<string, string[]> {
    return Object.fromEntries((this.body?.errors ?? []).map((e) => [e.field, e.messages]));
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const code =
    body?.code ??
    (response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'UNKNOWN');
  return new ApiError(response.status, code, body);
}

/** Localised message for an error code, falling back to a generic one. */
export function errorMessage(error: unknown, messages: Record<string, string>): string {
  if (error instanceof ApiError) return messages[error.code] ?? messages.UNKNOWN;
  if (error instanceof TypeError) return messages.NETWORK ?? messages.UNKNOWN;
  return messages.UNKNOWN;
}
