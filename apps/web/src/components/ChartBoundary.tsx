import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export function ChartBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  return (
    <ErrorBoundary label="This chart">
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
