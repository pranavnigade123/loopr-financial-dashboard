import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { api, RequestError } from '../../api';
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

type RoutePath = (typeof navigation)[number]['path'];
const routePaths = new Set<string>(navigation.map((item) => item.path));

function routeFromLocation(): RoutePath {
  return routePaths.has(window.location.pathname)
    ? (window.location.pathname as RoutePath)
    : '/dashboard';
}

function defaultQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('pageSize')) params.set('pageSize', '10');
  return params.toString();
}

export function Workspace({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [route, setRoute] = useState<RoutePath>(routeFromLocation);
  const [query, setQuery] = useState(defaultQuery);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState(
    () => new URLSearchParams(window.location.search).get('search') ?? '',
  );
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const { data, loading, error, retry } = useDashboard(query, onLogout);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, '', `${route}${query ? `?${query}` : ''}`);
  }, [query, route]);

  useEffect(() => {
    const listener = () => {
      setRoute(routeFromLocation());
      setQuery(defaultQuery());
      setMobileOpen(false);
    };
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      if (!routePaths.has(path)) return;
      const next = path as RoutePath;
      window.history.pushState(null, '', `${next}${query ? `?${query}` : ''}`);
      setRoute(next);
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [query],
  );

  const update = useCallback((key: string, value: string) => {
    setQuery((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next.toString();
    });
    if (key === 'search') setHeaderSearch(value);
  }, []);

  const clear = useCallback(() => {
    setQuery('pageSize=10');
    setHeaderSearch('');
  }, []);

  const sort = useCallback((column: string) => {
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
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    update('search', headerSearch.trim());
    navigate('/transactions');
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

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const title = navigation.find((item) => item.path === route)?.label ?? 'Dashboard';
  const pageProps = {
    data,
    loading,
    query: { params, update, clear, sort },
    onNavigate: navigate,
    onExport: () => setExportOpen(true),
  };

  return (
    <div className="flex min-h-dvh bg-panel">
      <aside
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
            <a
              key={path}
              href={path}
              className={`relative flex min-h-[55px] items-center gap-5 rounded-[11px] px-4 text-sm font-medium no-underline transition-colors hover:bg-[#22252c] hover:text-white ${route === path ? 'text-accent after:absolute after:right-[-30px] after:h-[31px] after:w-2 after:rounded-l-lg after:bg-expense' : 'text-[#9a9ba1]'}`}
              aria-current={route === path ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigate(path);
              }}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
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

      <div className="min-w-0 flex-1 bg-canvas min-[821px]:ml-[268px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between bg-panel px-5 min-[821px]:h-24 min-[821px]:px-[38px]">
          <div className="flex items-center gap-3.5">
            <button
              className="grid place-items-center border-0 bg-transparent text-[#a6a8ae] min-[821px]:hidden"
              aria-label="Open navigation"
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

        <main className="px-[18px] py-6 min-[821px]:px-[38px] min-[821px]:py-[42px]">
          {(error || logoutError) && (
            <div className="mb-[22px] flex items-center justify-between gap-4 rounded-[9px] border border-[#79414c] bg-[#42292e] px-[15px] py-3 text-[13px] text-[#ffccd3]">
              <span>{error || logoutError}</span>
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
          {route === '/dashboard' && <DashboardPage {...pageProps} />}
          {route === '/transactions' && <TransactionsPage {...pageProps} />}
          {route === '/wallet' && <WalletPage {...pageProps} />}
          {route === '/analytics' && <AnalyticsPage {...pageProps} />}
          {route === '/personal' && <PersonalPage user={user} />}
          {route === '/messages' && <MessagesPage data={data} />}
          {route === '/settings' && <SettingsPage />}
          {!routePaths.has(route) && <EmptyState />}
        </main>
      </div>

      {exportOpen && data?.transactions && (
        <ExportDialog
          query={query}
          total={data.transactions.total}
          preview={data.transactions.items}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
