import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowUpDown,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  LayoutDashboard,
  LogOut,
  Wallet,
} from 'lucide-react';
import type { SessionUser } from '@loopr/contracts';
import { api, RequestError } from '../../api';
import { Brand } from '../../components/Brand';
import { useDashboard } from './useDashboard';
import { money, displayDate } from './format';
import { Filters } from './Filters';
const TrendChart = lazy(() =>
  import('./Charts').then((module) => ({ default: module.TrendChart })),
);
const CategoryChart = lazy(() =>
  import('./Charts').then((module) => ({ default: module.CategoryChart })),
);
import { ExportDialog } from './ExportDialog';

const defaultQuery = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('pageSize')) params.set('pageSize', '10');
  return params.toString();
};

export function Workspace({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [query, setQuery] = useState(defaultQuery);
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const { data, loading, error, retry } = useDashboard(query, onLogout);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [query]);
  useEffect(() => {
    const listener = () => setQuery(defaultQuery());
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);
  const update = useCallback((key: string, value: string) => {
    setQuery((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next.toString();
    });
  }, []);
  function sort(column: string) {
    setQuery((current) => {
      const next = new URLSearchParams(current);
      const direction =
        (next.get('sortBy') ?? 'date') === column && (next.get('sortOrder') ?? 'desc') === 'asc'
          ? 'desc'
          : 'asc';
      next.set('sortBy', column);
      next.set('sortOrder', direction);
      next.set('page', '1');
      return next.toString();
    });
  }
  async function logout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await api<void>('/auth/logout', { method: 'POST' });
      onLogout();
    } catch (cause) {
      if (cause instanceof RequestError && cause.status === 401) onLogout();
      else setLogoutError('Unable to sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }
  const analytics = data?.analytics;
  const transactions = data?.transactions;
  const page = transactions?.page ?? Number(params.get('page') ?? 1);
  const pages = transactions
    ? Math.max(1, Math.ceil(transactions.total / transactions.pageSize))
    : 1;
  const cards = [
    {
      label: 'Net cash flow',
      value: analytics ? money(analytics.netCashFlowMinor) : '—',
      note: 'Paid revenue minus expenses',
      icon: Wallet,
    },
    {
      label: 'Revenue',
      value: analytics ? money(analytics.paidRevenueMinor) : '—',
      note: 'Paid transactions',
      icon: ArrowDownLeft,
    },
    {
      label: 'Expenses',
      value: analytics ? money(analytics.paidExpenseMinor) : '—',
      note: 'Paid transactions',
      icon: ArrowUpRight,
    },
    {
      label: 'Pending',
      value: analytics ? String(analytics.pendingCount) : '—',
      note: 'Awaiting payment',
      icon: Clock3,
    },
  ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Main navigation" className="space-y-8">
          <a className="nav-active" href="#overview">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a
            className="flex items-center gap-4 text-sm text-muted hover:text-white"
            href="#transactions"
          >
            <Wallet size={20} />
            Transactions
          </a>
          <a
            className="flex items-center gap-4 text-sm text-muted hover:text-white"
            href="#breakdown"
          >
            <ChartNoAxesCombined size={20} />
            Breakdown
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">DA</span>
          <div>
            <strong>{user.name}</strong>
            <span>Analyst workspace</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header>
          <h1>Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{user.name}</span>
            <button
              className="secondary"
              onClick={() => {
                void logout();
              }}
              disabled={loggingOut}
            >
              <LogOut size={16} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>
        <main className="dashboard-content" id="overview">
          <div className="page-intro">
            <div>
              <p className="eyebrow">FINANCIAL OVERVIEW</p>
              <h2>Your finances, in focus.</h2>
              <p className="muted">
                Explore activity. Understand the numbers. Export what matters.
              </p>
            </div>
            <button
              className="primary gap-3"
              onClick={() => setExportOpen(true)}
              disabled={!transactions?.total || loading}
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
          <Filters
            params={params}
            users={data?.metadata.users ?? []}
            update={update}
            clear={() => setQuery('pageSize=10')}
          />
          {(error || logoutError) && (
            <div className="alert flex items-center justify-between gap-4" role="alert">
              <span>{error || logoutError}</span>
              {error && (
                <button className="text-button" onClick={retry}>
                  Retry
                </button>
              )}
            </div>
          )}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4" aria-busy={loading}>
            {cards.map(({ label, value, note, icon: Icon }) => (
              <section className="metric-card" key={label}>
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-canvas text-accent">
                  <Icon size={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm text-muted">{label}</h3>
                  <p
                    className={`mt-1 text-[clamp(1.3rem,2vw,1.9rem)] font-semibold tracking-tight tabular-nums ${loading ? 'animate-pulse text-muted' : ''}`}
                  >
                    {loading ? '—' : value}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{note}</p>
                </div>
              </section>
            ))}
          </div>
          <div className="mb-6 grid min-w-0 gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="panel min-w-0">
              <div className="panel-title">
                <div>
                  <h3>Overview</h3>
                  <p className="muted">Monthly paid activity · USD</p>
                </div>
                <span className="period !px-3 !py-2">Monthly</span>
              </div>
              {loading ? (
                <div className="chart-empty animate-pulse">Loading activity…</div>
              ) : analytics ? (
                <Suspense fallback={<div className="chart-empty">Loading chart…</div>}>
                  <TrendChart analytics={analytics} />
                </Suspense>
              ) : (
                <div className="chart-empty">Activity unavailable</div>
              )}
            </section>
            <section className="panel min-w-0">
              <div className="panel-title">
                <h3>Recent transactions</h3>
                <a className="whitespace-nowrap text-xs text-accent" href="#transactions">
                  See all
                </a>
              </div>
              {loading ? (
                <div className="chart-empty animate-pulse">Loading transactions…</div>
              ) : data?.recent.items.length ? (
                <ul className="divide-y divide-white/10">
                  {data.recent.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-5 first:pt-1">
                      <span className="avatar">{item.userId.slice(-2)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted">
                          {item.category === 'Revenue' ? 'Revenue from' : 'Expense for'}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {item.userId.replace('user_', 'User ')}
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                          {displayDate(item.date)} · {item.status}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums ${item.category === 'Revenue' ? 'text-accent' : 'text-expense'}`}
                      >
                        {item.category === 'Revenue' ? '+' : '−'}
                        {money(item.amountMinor)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="chart-empty">No matching transactions.</div>
              )}
            </section>
          </div>
          <section className="panel mb-6" id="transactions">
            <div className="panel-title">
              <div>
                <h3>Transactions</h3>
                <p className="muted">
                  {transactions ? `${transactions.total} matching records` : 'Company transactions'}{' '}
                  · USD · Dates in UTC
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Rows
                <select
                  className="filter-input !w-auto !py-2"
                  value={params.get('pageSize') ?? '10'}
                  onChange={(event) => update('pageSize', event.target.value)}
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </label>
            </div>
            <div className="table-scroll" aria-busy={loading}>
              <table>
                <caption className="sr-only">
                  Company transactions matching the selected filters
                </caption>
                <thead>
                  <tr>
                    {[
                      { key: 'userId', label: 'User' },
                      { key: 'date', label: 'Date' },
                      { key: 'category', label: 'Category' },
                      { key: 'amountMinor', label: 'Amount' },
                      { key: 'status', label: 'Status' },
                    ].map(({ key, label }) => {
                      const selected = (params.get('sortBy') ?? 'date') === key;
                      const asc = params.get('sortOrder') === 'asc';
                      return (
                        <th
                          key={key}
                          scope="col"
                          aria-sort={selected ? (asc ? 'ascending' : 'descending') : 'none'}
                        >
                          <button
                            className={`flex w-full items-center gap-2 ${key === 'amountMinor' ? 'justify-end' : ''}`}
                            onClick={() => sort(key)}
                          >
                            {label}
                            {selected ? (
                              asc ? (
                                <ArrowUp size={13} />
                              ) : (
                                <ArrowDown size={13} />
                              )
                            ) : (
                              <ArrowUpDown size={13} className="opacity-50" />
                            )}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-message">
                        Loading transactions…
                      </td>
                    </tr>
                  ) : transactions?.items.length ? (
                    transactions.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <span className="avatar">{item.userId.slice(-2)}</span>
                            <span>
                              {item.userId.replace('user_', 'User ')}
                              <small>Transaction #{item.id}</small>
                            </span>
                          </div>
                        </td>
                        <td>{displayDate(item.date)}</td>
                        <td>
                          <span className={`category ${item.category.toLowerCase()}`}>
                            {item.category === 'Revenue' ? (
                              <ArrowDownLeft size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                            {item.category}
                          </span>
                        </td>
                        <td className={`numeric amount ${item.category.toLowerCase()}`}>
                          {item.category === 'Revenue' ? '+' : '−'}
                          {money(item.amountMinor)}
                        </td>
                        <td>
                          <span className={`badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="table-message">
                        {error
                          ? 'Transactions could not be loaded.'
                          : 'No transactions match. Try adjusting or clearing the filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="pagination">
              <span>
                Page {page} of {pages}
              </span>
              <div>
                <button
                  className="secondary"
                  aria-label="Previous page"
                  disabled={page <= 1 || loading}
                  onClick={() => update('page', String(page - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="secondary"
                  aria-label="Next page"
                  disabled={page >= pages || loading}
                  onClick={() => update('page', String(page + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </section>
          <section id="breakdown" className="panel">
            <div className="panel-title">
              <div>
                <h3>Category breakdown</h3>
                <p className="muted">Paid amounts by transaction category</p>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {loading ? (
                <div className="chart-empty">Loading categories…</div>
              ) : analytics ? (
                <Suspense fallback={<div className="chart-empty">Loading chart…</div>}>
                  <CategoryChart analytics={analytics} />
                </Suspense>
              ) : (
                <div className="chart-empty">Category totals unavailable.</div>
              )}
              <div className="flex flex-col justify-center rounded-xl bg-canvas p-5">
                <h4 className="text-sm font-medium">Pending activity</h4>
                <p className="muted mt-2">
                  These amounts are awaiting payment and are excluded from paid totals.
                </p>
                <div className="mt-5 flex flex-wrap gap-8">
                  <div>
                    <p className="text-xs text-muted">Incoming</p>
                    <p className="mt-1 text-xl font-semibold text-accent">
                      {!loading && analytics ? money(analytics.pendingRevenueMinor) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Outgoing</p>
                    <p className="mt-1 text-xl font-semibold text-expense">
                      {!loading && analytics ? money(analytics.pendingExpenseMinor) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <p className="mt-5 text-center text-[11px] text-muted">
            Penta · Financial analytics · USD display currency · All dates in UTC
          </p>
        </main>
      </div>
      {exportOpen && transactions && (
        <ExportDialog
          query={query}
          total={transactions.total}
          preview={transactions.items}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
