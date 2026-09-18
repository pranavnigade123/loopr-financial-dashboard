import type { ApiError } from '@loopr/contracts';

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'X-Requested-With': 'loopr',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new RequestError(
      response.status,
      body?.error?.message ?? 'Unable to complete the request. Please try again.',
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
