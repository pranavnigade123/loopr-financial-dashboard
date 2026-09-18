import { useEffect, useState } from 'react';
import type { Analytics, TransactionMetadata, TransactionPage } from '@loopr/contracts';
import { api, RequestError } from '../../api';

export function useDashboard(query: string, onUnauthorized: () => void) {
  const [data, setData] = useState<{
    transactions: TransactionPage;
    analytics: Analytics;
    recent: TransactionPage;
    metadata: TransactionMetadata;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setLoading(true);
    setError('');
    const recent = new URLSearchParams(query);
    recent.set('page', '1');
    recent.set('pageSize', '3');
    recent.set('sortBy', 'date');
    recent.set('sortOrder', 'desc');
    Promise.all([
      api<TransactionPage>(`/transactions?${query}`, options),
      api<Analytics>(`/analytics?${query}`, options),
      api<TransactionPage>(`/transactions?${recent}`, options),
      api<TransactionMetadata>('/transactions/metadata', options),
    ])
      .then(([transactions, analytics, recent, metadata]) => {
        if (!controller.signal.aborted) setData({ transactions, analytics, recent, metadata });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        if (cause instanceof RequestError && cause.status === 401) onUnauthorized();
        else setError(cause instanceof Error ? cause.message : 'Unable to load your dashboard.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision, onUnauthorized]);
  return { data, loading, error, retry: () => setRevision((value) => value + 1) };
}
