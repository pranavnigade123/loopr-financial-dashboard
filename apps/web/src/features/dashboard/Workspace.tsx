import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useNavigationFocus } from '../../components/useNavigationFocus';
import {
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import type { SessionUser } from '@loopr/contracts';
import { api, errorMessage, RequestError } from '../../api';
import { Brand } from '../../components/Brand';
import { ui } from '../../components/ui';
import { useDashboard } from './useDashboard';
import {
  AnalyticsPage,
  DashboardPage,
  EmptyState,
  MessagesPage,
  PersonalPage,
  SettingsPage,
  TransactionsPage,
  WalletPage,
} from './Pages';
import { ExportDialog } from './ExportDialog';

const navigation = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: WalletCards },
  { path: '/wallet', label: 'Wallet', icon: WalletCards },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { path: '/personal', label: 'Personal', icon: UserRound },
  { path: '/messages', label: 'Message', icon: Mail },
  { path: '/settings', label: 'Setting', icon: Settings },
] as const;

const routePaths = new Set<string>(navigation.map((item) => item.path));

export function Workspace({
  user,
  onLogout,
  onExpired,
}: {
  user: SessionUser;
  onLogout: () => void;
  onExpired: () => void;
}) {
  const location = useLocation();
  const route = location.pathname;
  const routerNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    if (!params.has('pageSize')) params.set('pageSize', '10');
    return params.toString();
  }, [searchParams]);
  const setQuery = useCallback(
    (next: string | ((current: string) => string)) => {
      setSearchParams((current) => (typeof next === 'string' ? next : next(current.toString())));
    },
    [setSearchParams],
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const closeNavigation = useCallback(() => setMobileOpen(false), []);
  useNavigationFocus(mobileOpen, sidebar, closeNavigation);
  const [headerSearch, setHeaderSearch] = useState(
    () => new URLSearchParams(window.location.search).get('search') ?? '',
  );
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const { data, loading, refreshing, error, ready, retry } = useDashboard(query, onExpired);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setHeaderSearch(new URLSearchParams(query).get('search') ?? '');
  }, [query]);
  useEffect(() => {
    setMobileOpen(false);
    setExportOpen(false);
  }, [location.key]);

  const navigate = useCallback(
    (path: string) => {
      if (!routePaths.has(path)) return;
      routerNavigate(`${path}?${query}`);
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [query, routerNavigate],
  );

  const update = useCallback(
    (key: string, value: string) => {
      setQuery((current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.set('page', '1');
        return next.toString();
      });
      if (key === 'search') setHeaderSearch(value);
    },
    [setQuery],
  );

  const clear = useCallback(() => {
    setQuery('pageSize=10');
    setHeaderSearch('');
  }, [setQuery]);

  const sort = useCallback(
    (column: string) => {
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
    },
    [setQuery],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(query);
    if (headerSearch.trim()) next.set('search', headerSearch.trim());
    else next.delete('search');
    next.set('page', '1');
    routerNavigate(`/transactions?${next}`);
  }

  async function logout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await api<void>('/auth/logout', { method: 'POST' });
      onLogout();
    } catch (cause) {
      if (cause instanceof RequestError && cause.status === 401) onLogout();
      else setLogoutError(`Unable to sign out. ${errorMessage(cause)}`);
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const title = navigation.find((item) => item.path === route)?.label ?? 'Page not found';
  const pageProps = {
    data,
    loading,
    query: { params, update, clear, sort },
    onNavigate: navigate,
    onExport: () => {
      if (ready) setExportOpen(true);
    },
  };

  return (
    <div className="flex min-h-dvh bg-panel">
      <aside
        ref={sidebar}
        id="main-navigation"
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Workspace navigation"
        className={`fixed inset-y-0 left-0 z-30 flex w-[min(288px,86vw)] flex-col bg-panel px-[30px] py-7 transition-transform duration-200 min-[821px]:visible min-[821px]:w-[268px] min-[821px]:translate-x-0 min-[821px]:py-[38px] ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-[105%] min-[821px]:visible'}`}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            className="grid size-9 place-items-center border-0 bg-transparent text-[#a6a8ae] min-[821px]:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </button>
        </div>
        <nav aria-label="Main navigation" className="mt-[62px] flex flex-col gap-[9px]">
          {navigation.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={`${path}?${query}`}
              className={`relative flex min-h-[55px] items-center gap-5 rounded-[11px] px-4 text-sm font-medium no-underline transition-colors hover:bg-[#22252c] hover:text-white ${route === path ? 'text-accent after:absolute after:right-[-30px] after:h-[31px] after:w-2 after:rounded-l-lg after:bg-expense' : 'text-[#9a9ba1]'}`}
              aria-current={route === path ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-[#292c33] pt-6">
          <button
            className="flex min-w-0 flex-1 items-center gap-2.5 border-0 bg-transparent text-left text-white"
            onClick={() => navigate('/personal')}
          >
            <span className={ui.avatar}>{initials}</span>
            <span className="min-w-0">
              <strong className="block max-w-[118px] truncate text-xs">{user.name}</strong>
              <small className="mt-[3px] block max-w-[118px] truncate text-[10px] text-[#8e929b]">
                Analyst workspace
              </small>
            </span>
          </button>
          <button
            className="grid rounded-lg border-0 bg-transparent p-2 text-[#a6a8ae] hover:bg-[#292d35] hover:text-white"
            aria-label="Sign out"
            onClick={() => void logout()}
            disabled={loggingOut}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-25 border-0 bg-[#05070bbd] min-[821px]:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div inert={mobileOpen} className="min-w-0 flex-1 bg-canvas min-[821px]:ml-[268px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between bg-panel px-5 min-[821px]:h-24 min-[821px]:px-[38px]">
          <div className="flex items-center gap-3.5">
            <button
              className="grid place-items-center border-0 bg-transparent text-[#a6a8ae] min-[821px]:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="main-navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </button>
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.7px] min-[821px]:text-[28px]">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2 min-[821px]:gap-5">
            <form
              className="hidden h-[45px] w-[min(290px,27vw)] items-center rounded-[10px] bg-[#292c34] min-[621px]:flex"
              role="search"
              onSubmit={search}
            >
              <label className="sr-only" htmlFor="global-search">
                Search transactions
              </label>
              <input
                id="global-search"
                maxLength={100}
                placeholder="Search..."
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent px-[17px] text-[13px] text-[#f5f6f7] outline-0 placeholder:text-[#91949c]"
              />
              <button
                className="grid h-full place-items-center border-0 bg-transparent px-[15px] text-[#a9abb0]"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            </form>
            <button
              className="relative grid size-[38px] place-items-center rounded-[10px] border-0 bg-transparent text-[#a6a8ae] hover:bg-[#292c34]"
              aria-label="Open messages"
              onClick={() => navigate('/messages')}
            >
              <Bell size={21} />
              <i className="absolute right-[5px] top-1.5 size-[7px] rounded-full border-2 border-panel bg-accent" />
            </button>
            <button
              className={ui.avatar}
              aria-label="Open personal profile"
              onClick={() => navigate('/personal')}
            >
              {initials}
            </button>
          </div>
        </header>

        <main
          key={route}
          className="px-[18px] py-6 motion-safe:animate-page-enter min-[821px]:px-[38px] min-[821px]:py-[42px]"
          aria-busy={refreshing}
        >
          {route === '/' && <Navigate to={`/dashboard?${query}`} replace />}
          {refreshing && (
            <div
              role="status"
              className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-panel px-4 py-2 text-xs text-muted shadow-lg"
            >
              <span className="size-2 rounded-full bg-accent motion-safe:animate-pulse" />
              Updating results…
            </div>
          )}
          {(error || logoutError) && (
            <div
              role="alert"
              className="mb-[22px] flex items-center justify-between gap-4 rounded-[9px] border border-[#79414c] bg-[#42292e] px-[15px] py-3 text-[13px] text-[#ffccd3]"
            >
              <span>
                {error || logoutError}
                {error && data ? ' Previously loaded results are shown below.' : ''}
              </span>
              {error && (
                <button
                  className="border-0 bg-transparent text-[#ffccd3] underline"
                  onClick={retry}
                >
                  Retry
                </button>
              )}
            </div>
          )}
          <ErrorBoundary key={route} label={title}>
            {route === '/dashboard' && <DashboardPage {...pageProps} />}
            {route === '/transactions' && <TransactionsPage {...pageProps} loading={!ready} />}
            {route === '/wallet' && <WalletPage {...pageProps} />}
            {route === '/analytics' && <AnalyticsPage {...pageProps} />}
            {route === '/personal' && <PersonalPage user={user} />}
            {route === '/messages' && <MessagesPage data={data} />}
            {route === '/settings' && <SettingsPage />}
            {!routePaths.has(route) && route !== '/' && (
              <>
                <EmptyState />
                <Link className={ui.secondary} to="/dashboard">
                  Back to dashboard
                </Link>
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {exportOpen && ready && data?.transactions && (
        <ExportDialog
          query={query}
          total={data.transactions.total}
          preview={data.transactions.items}
          onClose={() => setExportOpen(false)}
          onUnauthorized={onExpired}
        />
      )}
    </div>
  );
}
