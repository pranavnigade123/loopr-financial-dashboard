import { lazy, Suspense, type ElementType } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Landmark,
  Mail,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import type { SessionUser, Transaction } from '@loopr/contracts';
import { ui } from '../../components/ui';
import type { DashboardData } from './useDashboard';
import { displayDate, money } from './format';
import { Filters } from './Filters';

const TrendChart = lazy(() =>
  import('./Charts').then((module) => ({ default: module.TrendChart })),
);
const CategoryChart = lazy(() =>
  import('./Charts').then((module) => ({ default: module.CategoryChart })),
);

const pageStack = 'mx-auto flex max-w-[1540px] flex-col gap-[30px]';
const pageHeading = 'flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end';
const panelTitle = 'mb-6 flex items-center justify-between gap-[18px]';
const tableWrap = 'w-full overflow-x-auto';

interface QueryActions {
  params: URLSearchParams;
  update: (key: string, value: string) => void;
  clear: () => void;
  sort: (column: string) => void;
}

interface PageProps {
  data: DashboardData | null;
  loading: boolean;
  query: QueryActions;
  onNavigate: (path: string) => void;
  onExport: () => void;
}

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

function TransactionIdentity({ item }: { item: Transaction }) {
  return (
    <div className="flex items-center gap-[13px]">
      <span className={ui.avatar}>{item.userId.slice(-2)}</span>
      <span>
        {item.userId.replace('user_', 'User ')}
        <small className="mt-[3px] block text-[10px] text-[#858992]">Transaction #{item.id}</small>
      </span>
    </div>
  );
}

function TransactionRows({ items }: { items: Transaction[] }) {
  return (
    <>
      {items.map((item) => (
        <tr key={item.id}>
          <td className="border-b border-[#2c2f36] px-[17px] py-[17px] text-[#d9dce1]">
            <TransactionIdentity item={item} />
          </td>
          <td className="border-b border-[#2c2f36] px-[17px] py-[17px] text-[#d9dce1]">
            {displayDate(item.date)}
          </td>
          <td className="border-b border-[#2c2f36] px-[17px] py-[17px] text-[#d9dce1]">
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${item.category === 'Revenue' ? 'text-accent' : 'text-expense'}`}
            >
              {item.category === 'Revenue' ? (
                <ArrowDownLeft size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}
              {item.category}
            </span>
          </td>
          <td
            className={`border-b border-[#2c2f36] px-[17px] py-[17px] text-right font-semibold tabular-nums ${item.category === 'Revenue' ? 'text-accent' : 'text-expense'}`}
          >
            {item.category === 'Revenue' ? '+' : '−'}
            {money(item.amountMinor)}
          </td>
          <td className="border-b border-[#2c2f36] px-[17px] py-[17px] text-[#d9dce1]">
            <span
              className={`inline-block min-w-[82px] rounded-full px-[13px] py-[5px] text-center text-[11px] font-semibold ${item.status === 'Paid' ? 'bg-[#195330] text-[#2ce365]' : 'bg-[#624d18] text-[#ffd13e]'}`}
            >
              {item.status}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

export function DashboardPage({ data, loading, onNavigate }: PageProps) {
  const analytics = data?.analytics;
  const cards = [
    {
      label: 'Balance',
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
            <Suspense
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <TrendChart analytics={analytics} hideLegend />
            </Suspense>
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

function SortableHeading({
  column,
  label,
  params,
  sort,
  numeric = false,
}: {
  column: string;
  label: string;
  params: URLSearchParams;
  sort: (column: string) => void;
  numeric?: boolean;
}) {
  const selected = (params.get('sortBy') ?? 'date') === column;
  const ascending = params.get('sortOrder') === 'asc';
  return (
    <th
      className="px-[17px] py-[15px] font-medium first:rounded-l-[10px] last:rounded-r-[10px]"
      scope="col"
      aria-sort={selected ? (ascending ? 'ascending' : 'descending') : 'none'}
    >
      <button
        className={`flex w-full items-center gap-2 border-0 bg-transparent text-inherit ${numeric ? 'justify-end' : ''}`}
        onClick={() => sort(column)}
      >
        {label}
        {selected ? (
          ascending ? (
            <ArrowUp size={13} />
          ) : (
            <ArrowDown size={13} />
          )
        ) : (
          <ArrowUpDown size={13} />
        )}
      </button>
    </th>
  );
}

export function TransactionsPage({ data, loading, query, onExport }: PageProps) {
  const transactions = data?.transactions;
  const page = transactions?.page ?? Number(query.params.get('page') ?? 1);
  const pages = transactions
    ? Math.max(1, Math.ceil(transactions.total / transactions.pageSize))
    : 1;
  return (
    <div className={pageStack}>
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>TRANSACTION LEDGER</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>All transactions</h2>
          <p className={ui.muted}>Search, filter, sort and export the complete dataset.</p>
        </div>
        <button
          className={`${ui.primary} w-full sm:w-auto`}
          onClick={onExport}
          disabled={!transactions?.total || loading}
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>
      <section className={ui.panel}>
        <Filters
          params={query.params}
          users={data?.metadata.users ?? []}
          update={query.update}
          clear={query.clear}
        />
        <div className="mb-[18px] mt-[-2px] flex flex-col items-start justify-between gap-5 text-[13px] text-[#d7d9dd] sm:flex-row sm:items-center">
          <p className="m-0">
            {transactions ? `${transactions.total} matching records` : 'Company transactions'}{' '}
            <span className="text-[#898c95]">· USD · UTC</span>
          </p>
          <label className="flex items-center gap-2 text-xs text-muted">
            Rows
            <select
              className={`${ui.input} w-auto py-2 pl-2.5 pr-[30px]`}
              value={query.params.get('pageSize') ?? '10'}
              onChange={(event) => query.update('pageSize', event.target.value)}
            >
              <option>10</option>
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
          </label>
        </div>
        <div className={tableWrap} aria-busy={loading}>
          <table className="w-full border-collapse whitespace-nowrap text-[13px]">
            <caption className="sr-only">Transactions matching the selected filters</caption>
            <thead className="bg-[#282c35] text-left text-[#aaa6c3]">
              <tr>
                <SortableHeading
                  column="userId"
                  label="User"
                  params={query.params}
                  sort={query.sort}
                />
                <SortableHeading
                  column="date"
                  label="Date"
                  params={query.params}
                  sort={query.sort}
                />
                <SortableHeading
                  column="category"
                  label="Category"
                  params={query.params}
                  sort={query.sort}
                />
                <SortableHeading
                  column="amountMinor"
                  label="Amount"
                  params={query.params}
                  sort={query.sort}
                  numeric
                />
                <SortableHeading
                  column="status"
                  label="Status"
                  params={query.params}
                  sort={query.sort}
                />
              </tr>
            </thead>
            <tbody>
              {transactions?.items.length ? (
                <TransactionRows items={transactions.items} />
              ) : (
                <tr>
                  <td colSpan={5} className="h-[150px] text-center text-muted">
                    {loading ? 'Loading transactions…' : 'No transactions match these filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between pt-[22px] text-xs text-[#9699a2]">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              className={ui.secondary}
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => query.update('page', String(page - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className={ui.secondary}
              aria-label="Next page"
              disabled={page >= pages || loading}
              onClick={() => query.update('page', String(page + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

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
            <Suspense
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <TrendChart analytics={analytics} />
            </Suspense>
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
            <Suspense
              fallback={
                <div className="flex h-[270px] items-center justify-center text-[13px] text-muted">
                  Loading chart…
                </div>
              }
            >
              <CategoryChart analytics={analytics} />
            </Suspense>
          ) : null}
        </section>
      </div>
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

export function WalletPage({ data, loading, onNavigate }: PageProps) {
  const analytics = data?.analytics;
  return (
    <div className={pageStack}>
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>CASH POSITION</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Wallet</h2>
          <p className={ui.muted}>A clear view of realized and pending company funds.</p>
        </div>
      </div>
      <section className="flex min-h-[190px] items-center justify-between overflow-hidden rounded-[17px] bg-linear-to-r from-[#163e27] to-accent px-[23px] py-7 text-white sm:min-h-[220px] sm:px-[42px] sm:py-9">
        <div>
          <span className="block text-[13px] opacity-80">Available net cash flow</span>
          <strong className="my-2 block text-[clamp(32px,5vw,54px)] tracking-[-2px]">
            {loading || !analytics ? '—' : money(analytics.netCashFlowMinor)}
          </strong>
          <small className="block opacity-70">Paid revenue minus paid expenses</small>
        </div>
        <WalletCards className="hidden opacity-25 sm:block" size={54} />
      </section>
      <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-3">
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-accent">
            <ArrowDownLeft />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Total received</small>
            <strong className="my-1 block text-xl">
              {analytics ? money(analytics.paidRevenueMinor) : '—'}
            </strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Settled revenue</p>
          </div>
        </article>
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-expense">
            <ArrowUpRight />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Total spent</small>
            <strong className="my-1 block text-xl">
              {analytics ? money(analytics.paidExpenseMinor) : '—'}
            </strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Settled expenses</p>
          </div>
        </article>
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-[#b7bac2]">
            <Clock3 />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Awaiting settlement</small>
            <strong className="my-1 block text-xl">{analytics?.pendingCount ?? '—'}</strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Pending transactions</p>
          </div>
        </article>
      </div>
      <button className={`${ui.secondary} self-start`} onClick={() => onNavigate('/transactions')}>
        Review transaction ledger <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function PersonalPage({ user }: { user: SessionUser }) {
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>YOUR ACCOUNT</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Personal</h2>
          <p className={ui.muted}>Profile and workspace identity.</p>
        </div>
      </div>
      <section
        className={`${ui.panel} flex flex-col items-start gap-[22px] sm:flex-row sm:items-center`}
      >
        <span className="grid size-[82px] place-items-center rounded-[20px] bg-linear-to-br from-[#3b548d] to-[#253354] text-[22px] font-bold text-[#dce9ff]">
          {user.name
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div>
          <h3 className="m-0 text-[22px]">{user.name}</h3>
          <p className="mt-1 text-[#a2a5ad]">{user.email}</p>
          <span className="mt-2.5 inline-block rounded-full bg-[#194c2d] px-2.5 py-[5px] text-[11px] text-[#5de784]">
            Financial analyst
          </span>
        </div>
      </section>
      <section className={ui.panel}>
        <h3 className="mb-[15px] text-lg">Account details</h3>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Workspace role</span>
          <strong className="font-medium text-[#e9eaec]">Analyst</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Data access</span>
          <strong className="font-medium text-[#e9eaec]">Company transactions</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Display timezone</span>
          <strong className="font-medium text-[#e9eaec]">UTC</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Session security</span>
          <strong className="flex items-center gap-2 font-medium text-[#43de70]">
            <ShieldCheck size={16} />
            Protected
          </strong>
        </div>
      </section>
    </div>
  );
}

export function MessagesPage({ data }: { data: DashboardData | null }) {
  const analytics = data?.analytics;
  const notices = [
    {
      title: `${analytics?.pendingCount ?? 0} transactions need attention`,
      copy: 'Review pending activity and follow up before settlement.',
      icon: Clock3,
    },
    {
      title: 'Monthly report is ready',
      copy: 'Use Export CSV on the Transactions page to create a tailored report.',
      icon: Download,
    },
    {
      title: 'Your workspace is protected',
      copy: 'Authentication sessions are revocable and expire automatically.',
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>INBOX</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Messages</h2>
          <p className={ui.muted}>System insights and financial reminders.</p>
        </div>
      </div>
      <section className="rounded-[14px] bg-panel px-7">
        {notices.map(({ title, copy, icon: Icon }, index) => (
          <article
            key={title}
            className="grid min-h-[98px] grid-cols-[auto_1fr_auto] items-center gap-[17px] border-b border-[#30333b] last:border-0"
          >
            <span className="grid size-11 place-items-center rounded-[11px] bg-[#252a31] text-accent">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="m-0 text-sm">{title}</h3>
              <p className="mt-1 text-xs text-[#9699a2]">{copy}</p>
            </div>
            {index === 0 && (
              <i className="rounded-full bg-accent px-2 py-1 text-[9px] font-bold not-italic text-[#112118]">
                New
              </i>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>PREFERENCES</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Settings</h2>
          <p className={ui.muted}>Workspace display and reporting defaults.</p>
        </div>
      </div>
      <section className={ui.panel}>
        <h3 className="mb-[15px] text-lg">Display</h3>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Currency</b>
            <small className="mt-1 block text-[#8c8f98]">
              Currency inferred from the supplied design
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">USD</strong>
        </div>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Date handling</b>
            <small className="mt-1 block text-[#8c8f98]">
              Consistent across charts, filters and exports
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">UTC</strong>
        </div>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Theme</b>
            <small className="mt-1 block text-[#8c8f98]">
              Optimized to match the Penta reference
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">Dark</strong>
        </div>
      </section>
      <section className="flex gap-3 rounded-xl border border-[#34513d] bg-[#1d3124] p-[17px] text-xs text-[#aeeabd]">
        <ShieldCheck size={20} />
        <p className="m-0 leading-relaxed">
          Security-sensitive account settings are managed by the server and are not exposed as
          decorative controls.
        </p>
      </section>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="grid min-h-[55vh] place-content-center text-center">
      <Mail />
      <h2>Page unavailable</h2>
      <p>Choose a destination from the navigation.</p>
    </div>
  );
}
