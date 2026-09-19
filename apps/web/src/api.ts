import type { ApiError } from '@loopr/contracts';

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
    public readonly retryAfter?: number,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function request(path: string, options: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        'X-Requested-With': 'loopr',
        ...options.headers,
      },
      signal: AbortSignal.any([
        AbortSignal.timeout(15000),
        ...(options.signal ? [options.signal] : []),
      ]),
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new RequestError(
      0,
      cause instanceof Error && cause.name === 'TimeoutError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.',
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new RequestError(
      response.status,
      response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : (body?.error?.message ?? 'Unable to complete the request. Please try again.'),
      body?.error?.requestId,
      response.headers.has('Retry-After') ? Number(response.headers.get('Retry-After')) : undefined,
      body?.error?.fields,
    );
  }
  return response;
}

export function errorMessage(cause: unknown): string {
  if (!(cause instanceof Error)) return 'Unable to complete the request. Please try again.';
  if (!(cause instanceof RequestError)) return cause.message;
  const wait =
    cause.retryAfter && Number.isFinite(cause.retryAfter)
      ? ` Retry in ${cause.retryAfter} seconds.`
      : '';
  const reference = cause.status >= 500 && cause.requestId ? ` Reference: ${cause.requestId}.` : '';
  return `${cause.message}${wait}${reference}`;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await request(path, options);
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new RequestError(502, 'The server returned an unreadable response. Please try again.');
  }
}
