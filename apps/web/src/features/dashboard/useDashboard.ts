import { useEffect, useRef, useState } from 'react';
import {
  transactionQuerySchema,
  type Analytics,
  type TransactionMetadata,
  type TransactionPage,
} from '@loopr/contracts';
import { api, errorMessage, RequestError } from '../../api';

export interface DashboardData {
  transactions: TransactionPage;
  analytics: Analytics;
  recent: TransactionPage;
  metadata: TransactionMetadata;
}

export function useDashboard(query: string, onUnauthorized: () => void) {
  const [result, setResult] = useState<{ query: string; data: DashboardData } | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  // Scoped to this authenticated workspace; logout unmounts and discards all entries.
  const cache = useRef(new Map<string, { value: unknown; expires: number }>());
  const parsed = transactionQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(query)));
  const validation = parsed.success
    ? ''
    : parsed.error.issues.map((issue) => issue.message).join(' ');

  useEffect(() => {
    if (validation) {
      setPending(false);
      return;
    }
    const controller = new AbortController();
    setPending(true);
    setError('');
    async function get<T>(path: string): Promise<T> {
      const existing = cache.current.get(path);
      if (existing && existing.expires > Date.now()) return existing.value as T;
      const value = await api<T>(path, { signal: controller.signal });
      if (!controller.signal.aborted) {
        if (cache.current.size >= 40) cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(path, { value, expires: Date.now() + 60000 });
      }
      return value;
    }
    const filters = new URLSearchParams(query);
    for (const key of ['page', 'pageSize', 'sortBy', 'sortOrder']) filters.delete(key);
    filters.sort();
    const recent = new URLSearchParams(filters);
    recent.set('pageSize', '3');
    Promise.all([
      get<TransactionPage>(`/transactions?${query}`),
      get<Analytics>(`/analytics?${filters}`),
      get<TransactionPage>(`/transactions?${recent}`),
      get<TransactionMetadata>('/transactions/metadata'),
    ])
      .then(([transactions, analytics, recent, metadata]) => {
        if (!controller.signal.aborted)
          setResult({ query, data: { transactions, analytics, recent, metadata } });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof RequestError && cause.status === 401) onUnauthorized();
        else setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [query, validation, revision, onUnauthorized]);

  const stale = result?.query !== query;
  return {
    data: result?.data ?? null,
    loading: pending && !result,
    refreshing: !validation && !error && !!result && (pending || stale),
    stale,
    error: validation || error,
    ready: !!result && !stale && !pending && !validation && !error,
    retry: () => {
      cache.current.clear();
      setRevision((value) => value + 1);
    },
  };
}
