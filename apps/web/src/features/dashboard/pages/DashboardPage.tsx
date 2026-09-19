import { ui } from '../../../components/ui';
import { lazy, type ElementType } from 'react';
import { ChartBoundary } from '../../../components/ChartBoundary';
import { CircleDollarSign, Clock3, Landmark, WalletCards } from 'lucide-react';
import { TransactionRows } from '../TransactionTable';
import { pageStack, panelTitle, tableWrap, type PageProps } from '../pageTypes';
import { money } from '../format';
const TrendChart = lazy(() =>
  import('../Charts').then((module) => ({ default: module.TrendChart })),
);
function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: ElementType;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <article className="flex min-h-[106px] items-center gap-[30px] rounded-[14px] bg-panel px-[23px] py-6 sm:min-h-[129px]">
      <span
        className="grid size-[54px] shrink-0 place-items-center rounded-xl bg-[#272b34] text-accent"
        aria-hidden="true"
      >
        <Icon size={23} strokeWidth={2.2} />
      </span>
      <div>
        <p className="mb-2 text-sm text-[#96989e]">{label}</p>
        <strong
          className={`block max-w-full truncate text-[clamp(21px,2vw,31px)] font-medium tracking-[-0.9px] text-[#f7f7f8] ${loading ? 'animate-pulse' : ''}`}
        >
          {loading ? '—' : value}
        </strong>
      </div>
    </article>
  );
}
export function DashboardPage({ data, loading, onNavigate }: PageProps) {
  const analytics = data?.analytics;
  const cards = [
    {
      label: 'Net cash flow',
      value: analytics ? money(analytics.netCashFlowMinor) : '—',
      icon: WalletCards,
    },
    {
      label: 'Revenue',
      value: analytics ? money(analytics.paidRevenueMinor) : '—',
      icon: CircleDollarSign,
    },
    {
      label: 'Expenses',
      value: analytics ? money(analytics.paidExpenseMinor) : '—',
      icon: Landmark,
    },
    {
      label: 'Pending',
      value: analytics ? money(analytics.pendingRevenueMinor - analytics.pendingExpenseMinor) : '—',
      icon: Clock3,
    },
  ];
  return (
    <div className={pageStack}>
      <section
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5 2xl:grid-cols-4 2xl:gap-7"
        aria-label="Financial summary"
        aria-busy={loading}
      >
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} loading={loading} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,2.1fr)_minmax(300px,1fr)] xl:gap-[30px]">
        <section className={ui.panel}>
          <div className={panelTitle}>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.3px]">Overview</h2>
              <p className="sr-only">Monthly paid revenue and expense activity</p>
            </div>
            <div
              className="flex items-center gap-5 text-xs text-[#9da0a7]"
              aria-label="Chart legend and period"
            >
              <span className="hidden items-center gap-2 sm:inline-flex">
                <i className="size-2.5 rounded-full bg-accent" />
                Income
              </span>
              <span className="hidden items-center gap-2 sm:inline-flex">
                <i className="size-2.5 rounded-full bg-expense" />
                Expenses
              </span>
              <span className="inline-flex min-h-[38px] items-center rounded-[9px] border border-[#3b3e46] px-[13px] text-[#a9abb2]">
                Monthly
              </span>
            </div>
          </div>
          {loading ? (
            <div className="flex h-[270px] animate-pulse items-center justify-center text-[13px] text-muted">
              Loading activity…
            </div>
          ) : analytics ? (
            <ChartBoundary
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <TrendChart analytics={analytics} hideLegend />
            </ChartBoundary>
          ) : (
            <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
              Activity unavailable
            </div>
          )}
        </section>

        <section className={ui.panel}>
          <div className={panelTitle}>
            <h2 className="text-xl font-semibold tracking-[-0.3px]">Recent Transaction</h2>
            <button
              className="border-0 bg-transparent p-1 text-[13px] font-medium text-accent"
              onClick={() => onNavigate('/transactions')}
            >
              See all
            </button>
          </div>
          {loading ? (
            <div className="flex h-[270px] animate-pulse items-center justify-center text-[13px] text-muted">
              Loading transactions…
            </div>
          ) : data?.recent.items.length ? (
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 xl:block">
              {data.recent.items.map((item) => (
                <li
                  key={item.id}
                  className="grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[13px] rounded-xl border border-[#30333b] p-3 xl:rounded-none xl:border-x-0 xl:border-t-0 xl:border-b-[#32353d] xl:p-0 last:xl:border-b-0"
                >
                  <span className={ui.avatar}>{item.userId.slice(-2)}</span>
                  <div className="min-w-0">
                    <small className="block truncate text-[11px] text-[#999ba2]">
                      {item.category === 'Revenue' ? 'Transfer from' : 'Transfer to'}
                    </small>
                    <strong className="mt-1 block truncate text-[13px] font-medium">
                      {item.userId.replace('user_', 'User ')}
                    </strong>
                  </div>
                  <b
                    className={`whitespace-nowrap text-[13px] font-semibold ${item.category === 'Revenue' ? 'text-accent' : 'text-expense'}`}
                  >
                    {item.category === 'Revenue' ? '+' : '−'}
                    {money(item.amountMinor)}
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
              No recent transactions
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[14px] bg-panel px-[17px] py-[21px] sm:px-[37px] sm:py-[29px]">
        <div className={panelTitle}>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.3px]">Transactions</h2>
            <p className={ui.muted}>Latest company activity</p>
          </div>
          <button
            className="border-0 bg-transparent p-1 text-[13px] font-medium text-accent"
            onClick={() => onNavigate('/transactions')}
          >
            View all
          </button>
        </div>
        <div className={tableWrap}>
          <table className="w-full border-collapse whitespace-nowrap text-[13px]">
            <thead className="bg-[#282c35] text-left text-[#aaa6c3]">
              <tr>
                <th className="rounded-l-[10px] px-[17px] py-[15px] font-medium">Name</th>
                <th className="px-[17px] py-[15px] font-medium">Date</th>
                <th className="px-[17px] py-[15px] font-medium">Category</th>
                <th className="px-[17px] py-[15px] text-right font-medium">Amount</th>
                <th className="rounded-r-[10px] px-[17px] py-[15px] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions.items.length ? (
                <TransactionRows items={data.transactions.items.slice(0, 5)} />
              ) : (
                <tr>
                  <td colSpan={5} className="h-[150px] text-center text-muted">
                    {loading ? 'Loading transactions…' : 'No transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
