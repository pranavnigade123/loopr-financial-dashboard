import { ui } from '../../../components/ui';
import { lazy } from 'react';
import { ChartBoundary } from '../../../components/ChartBoundary';
import { pageStack, pageHeading, panelTitle, type PageProps } from '../pageTypes';
import { Filters } from '../Filters';
import { money } from '../format';
const TrendChart = lazy(() =>
  import('../Charts').then((module) => ({ default: module.TrendChart })),
);
const CategoryChart = lazy(() =>
  import('../Charts').then((module) => ({ default: module.CategoryChart })),
);
const InsightCharts = lazy(() => import('../InsightCharts'));
export function AnalyticsPage({ data, loading, query }: PageProps) {
  const analytics = data?.analytics;
  return (
    <div className={pageStack}>
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>PERFORMANCE</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Analytics</h2>
          <p className={ui.muted}>Explore paid revenue and expenses across the selected period.</p>
        </div>
      </div>
      <Filters
        params={query.params}
        users={data?.metadata.users ?? []}
        update={query.update}
        clear={query.clear}
      />
      <div className="grid grid-cols-1 gap-[30px] xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,1fr)]">
        <section className={ui.panel}>
          <div className={panelTitle}>
            <h2 className="text-xl font-semibold">Cash-flow trend</h2>
            <span className="inline-flex min-h-[38px] items-center rounded-[9px] border border-[#3b3e46] px-[13px] text-xs text-[#a9abb2]">
              Monthly
            </span>
          </div>
          {loading ? (
            <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
              Loading…
            </div>
          ) : analytics ? (
            <ChartBoundary
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <TrendChart analytics={analytics} />
            </ChartBoundary>
          ) : null}
        </section>
        <section className={ui.panel}>
          <div className={panelTitle}>
            <h2 className="text-xl font-semibold">Category mix</h2>
          </div>
          {loading ? (
            <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
              Loading…
            </div>
          ) : analytics ? (
            <ChartBoundary
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <CategoryChart analytics={analytics} />
            </ChartBoundary>
          ) : null}
        </section>
      </div>
      {analytics && (
        <ChartBoundary
          fallback={
            <div className="h-64 rounded-2xl bg-panel motion-safe:animate-pulse" role="status">
              Loading insights…
            </div>
          }
        >
          <InsightCharts analytics={analytics} />
        </ChartBoundary>
      )}
      <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#373b44] p-5">
          <span className="block text-xs text-[#9497a0]">Filtered records</span>
          <strong className="mt-2 block text-[22px] font-semibold">
            {analytics?.total ?? '—'}
          </strong>
        </article>
        <article className="rounded-xl border border-[#373b44] p-5">
          <span className="block text-xs text-[#9497a0]">Pending records</span>
          <strong className="mt-2 block text-[22px] font-semibold">
            {analytics?.pendingCount ?? '—'}
          </strong>
        </article>
        <article className="rounded-xl border border-[#373b44] p-5">
          <span className="block text-xs text-[#9497a0]">Pending incoming</span>
          <strong className="mt-2 block text-[22px] font-semibold">
            {analytics ? money(analytics.pendingRevenueMinor) : '—'}
          </strong>
        </article>
        <article className="rounded-xl border border-[#373b44] p-5">
          <span className="block text-xs text-[#9497a0]">Pending outgoing</span>
          <strong className="mt-2 block text-[22px] font-semibold">
            {analytics ? money(analytics.pendingExpenseMinor) : '—'}
          </strong>
        </article>
      </section>
    </div>
  );
}
