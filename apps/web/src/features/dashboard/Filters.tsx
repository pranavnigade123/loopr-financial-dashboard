import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ui } from '../../components/ui';
import { transactionQuerySchema } from '@loopr/contracts';

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
  const validation = transactionQuerySchema.safeParse(Object.fromEntries(params));
  const issues = validation.success
    ? {}
    : Object.fromEntries(
        validation.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
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
            className={`${ui.input} pl-11`}
            placeholder="Search user, category, status, ID, date or amount…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
          />
        </label>
        <button
          className={`${ui.secondary} py-3`}
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
          <button className={ui.secondary} onClick={clear}>
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
          <label className="flex flex-col gap-2 text-xs text-muted">
            Category
            <select
              className={ui.input}
              value={params.get('category') ?? ''}
              onChange={(event) => update('category', event.target.value)}
            >
              <option value="">All categories</option>
              <option>Revenue</option>
              <option>Expense</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Status
            <select
              className={ui.input}
              value={params.get('status') ?? ''}
              onChange={(event) => update('status', event.target.value)}
            >
              <option value="">All statuses</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            User
            <select
              className={ui.input}
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
          <label className="flex flex-col gap-2 text-xs text-muted">
            From date (UTC)
            <input
              className={ui.input}
              type="date"
              aria-invalid={!!issues.dateFrom}
              value={params.get('dateFrom') ?? ''}
              max={params.get('dateTo') ?? undefined}
              onChange={(event) => update('dateFrom', event.target.value)}
            />
            {issues.dateFrom && <span className="text-rose-300">Enter a valid start date.</span>}
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Through date (UTC)
            <input
              className={ui.input}
              type="date"
              aria-invalid={!!issues.dateTo}
              aria-describedby={issues.dateTo ? 'date-range-error' : undefined}
              value={params.get('dateTo') ?? ''}
              min={params.get('dateFrom') ?? undefined}
              onChange={(event) => update('dateTo', event.target.value)}
            />
            {issues.dateTo && (
              <span id="date-range-error" className="text-rose-300">
                {issues.dateTo}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Minimum amount (USD)
            <input
              className={ui.input}
              type="number"
              aria-invalid={!!issues.amountMin}
              aria-describedby={issues.amountMin ? 'minimum-error' : undefined}
              min="0"
              step="0.01"
              placeholder="0.00"
              value={params.get('amountMin') ?? ''}
              onChange={(event) => update('amountMin', event.target.value)}
            />
            {issues.amountMin && (
              <span id="minimum-error" className="text-rose-300">
                Enter a nonnegative amount with at most two decimal places.
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-xs text-muted">
            Maximum amount (USD)
            <input
              className={ui.input}
              type="number"
              aria-invalid={!!issues.amountMax}
              aria-describedby={issues.amountMax ? 'maximum-error' : undefined}
              min="0"
              step="0.01"
              placeholder="No maximum"
              value={params.get('amountMax') ?? ''}
              onChange={(event) => update('amountMax', event.target.value)}
            />
            {issues.amountMax && (
              <span id="maximum-error" className="text-rose-300">
                Enter an amount at least equal to the minimum, with at most two decimal places.
              </span>
            )}
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
