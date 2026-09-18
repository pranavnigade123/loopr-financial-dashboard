import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export function Filters({
  params,
  users,
  update,
  clear,
}: {
  params: URLSearchParams;
  users: string[];
  update: (key: string, value: string) => void;
  clear: () => void;
}) {
  const currentSearch = params.get('search') ?? '';
  const [search, setSearch] = useState(currentSearch);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);
  useEffect(() => {
    if (search === currentSearch) return;
    const timer = window.setTimeout(() => update('search', search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search, currentSearch, update]);
  const active = [
    'search',
    'category',
    'status',
    'userId',
    'dateFrom',
    'dateTo',
    'amountMin',
    'amountMax',
  ].filter((key) => params.has(key));
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search transactions</span>
          <Search size={17} className="absolute left-3.5 top-3.5 text-muted" />
          <input
            className="filter-input w-full !pl-11"
            placeholder="Search user, category, status, ID, date or amount…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
          />
        </label>
        <button
          className="secondary !py-3"
          aria-expanded={expanded}
          aria-controls="advanced-filters"
          onClick={() => setExpanded((value) => !value)}
        >
          <SlidersHorizontal size={16} />
          Filters{' '}
          {active.length > 0 && (
            <span className="rounded bg-accent/20 px-1.5 text-accent">{active.length}</span>
          )}
        </button>
        {active.length > 0 && (
          <button className="secondary" onClick={clear}>
            <X size={14} />
            Clear
          </button>
        )}
      </div>
      {expanded && (
        <fieldset
          id="advanced-filters"
          className="mt-4 grid gap-4 rounded-xl border border-white/10 p-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <legend className="px-2 text-xs text-muted">
            Combine filters to refine all dashboard results
          </legend>
          <label className="filter-label">
            Category
            <select
              className="filter-input"
              value={params.get('category') ?? ''}
              onChange={(event) => update('category', event.target.value)}
            >
              <option value="">All categories</option>
              <option>Revenue</option>
              <option>Expense</option>
            </select>
          </label>
          <label className="filter-label">
            Status
            <select
              className="filter-input"
              value={params.get('status') ?? ''}
              onChange={(event) => update('status', event.target.value)}
            >
              <option value="">All statuses</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </label>
          <label className="filter-label">
            User
            <select
              className="filter-input"
              value={params.get('userId') ?? ''}
              onChange={(event) => update('userId', event.target.value)}
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user.replace('user_', 'User ')}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-label">
            From date (UTC)
            <input
              className="filter-input"
              type="date"
              value={params.get('dateFrom') ?? ''}
              max={params.get('dateTo') ?? undefined}
              onChange={(event) => update('dateFrom', event.target.value)}
            />
          </label>
          <label className="filter-label">
            Through date (UTC)
            <input
              className="filter-input"
              type="date"
              value={params.get('dateTo') ?? ''}
              min={params.get('dateFrom') ?? undefined}
              onChange={(event) => update('dateTo', event.target.value)}
            />
          </label>
          <label className="filter-label">
            Minimum amount (USD)
            <input
              className="filter-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={params.get('amountMin') ?? ''}
              onChange={(event) => update('amountMin', event.target.value)}
            />
          </label>
          <label className="filter-label">
            Maximum amount (USD)
            <input
              className="filter-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="No maximum"
              value={params.get('amountMax') ?? ''}
              onChange={(event) => update('amountMax', event.target.value)}
            />
          </label>
        </fieldset>
      )}
      {active.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
          {active.map((key) => (
            <button
              key={key}
              className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-green-200"
              aria-label={`Remove ${key} filter`}
              onClick={() => update(key, '')}
            >
              {key}: {params.get(key)}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
