import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, X } from 'lucide-react';
import { exportColumns, type ExportColumn, type Transaction } from '@loopr/contracts';
import { money, displayDate } from './format';
import { ui } from '../../components/ui';

const labels: Record<ExportColumn, string> = {
  id: 'Transaction ID',
  date: 'Date',
  amount: 'Amount',
  category: 'Category',
  status: 'Status',
  userId: 'User',
};
export function ExportDialog({
  query,
  total,
  preview,
  onClose,
}: {
  query: string;
  total: number;
  preview: Transaction[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [columns, setColumns] = useState<ExportColumn[]>([...exportColumns]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      abort.current?.abort();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  function move(index: number, direction: number) {
    setColumns((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }
  async function download() {
    setBusy(true);
    setError('');
    abort.current = new AbortController();
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'loopr' },
        body: JSON.stringify({ query: Object.fromEntries(new URLSearchParams(query)), columns }),
        signal: abort.current.signal,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error?.message ?? 'Export failed. Please try again.');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `penta-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onClose();
    } catch (cause) {
      if (!abort.current.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="fixed m-auto max-h-[90dvh] w-[min(780px,94vw)] overflow-y-auto rounded-2xl border border-white/15 bg-panel p-7 text-[#f3f4f6] shadow-2xl backdrop:bg-[#080a10bb] backdrop:backdrop-blur-[5px]"
      aria-labelledby="export-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={ui.eyebrow}>BUILD YOUR REPORT</p>
          <h2 id="export-title" className="mt-2 text-2xl font-semibold">
            Export transactions
          </h2>
          <p className={`${ui.muted} mt-2`}>
            All {total} matching transactions, across every page.
          </p>
        </div>
        <button className={ui.secondary} aria-label="Close export" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="mt-6 grid gap-7 md:grid-cols-[220px_1fr]">
        <fieldset disabled={busy}>
          <legend className="mb-3 text-sm font-medium">Choose columns</legend>
          <div className="space-y-2">
            {exportColumns.map((column) => (
              <label
                key={column}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-canvas px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={columns.includes(column)}
                  onChange={() =>
                    setColumns((current) =>
                      current.includes(column)
                        ? current.filter((item) => item !== column)
                        : [...current, column],
                    )
                  }
                />
                {labels[column]}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <h3 className="mb-3 text-sm font-medium">Column order</h3>
          <ol className="space-y-2">
            {columns.map((column, index) => (
              <li
                key={column}
                className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 text-sm"
              >
                <span>
                  <span className="mr-3 text-muted">{index + 1}.</span>
                  {labels[column]}
                </span>
                <span className="flex gap-1">
                  <button
                    className={`${ui.secondary} p-1.5`}
                    disabled={!index || busy}
                    aria-label={`Move ${labels[column]} up`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className={`${ui.secondary} p-1.5`}
                    disabled={index === columns.length - 1 || busy}
                    aria-label={`Move ${labels[column]} down`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {!columns.length && <p className={ui.muted}>Select at least one column.</p>}
        </div>
      </div>
      <div className="mt-7">
        <h3 className="mb-3 text-sm font-medium">
          Preview{' '}
          <span className="font-normal text-muted">· up to 3 rows from the current page</span>
        </h3>
        <div className="w-full overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full border-collapse whitespace-nowrap text-[13px]">
            <thead className="bg-[#282c35] text-left text-[#aaa6c3]">
              <tr>
                {columns.map((column) => (
                  <th className="px-[17px] py-[15px] font-medium" key={column}>
                    {labels[column]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 3).map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td
                      className="border-b border-[#2c2f36] px-[17px] py-[17px] text-[#d9dce1]"
                      key={column}
                    >
                      {column === 'amount'
                        ? money(row.amountMinor)
                        : column === 'date'
                          ? displayDate(row.date)
                          : row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          CSV uses exact decimal amounts and UTC timestamps. Category identifies incoming or
          outgoing transactions.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[#79414c] bg-[#42292e] px-4 py-3 text-[13px] text-[#ffccd3]"
        >
          {error}
        </p>
      )}
      <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
        <span className="text-xs text-muted">UTF-8 CSV · Headers included</span>
        <button
          className={ui.primary}
          disabled={!columns.length || busy || !total}
          onClick={() => {
            void download();
          }}
        >
          <Download size={17} />
          {busy ? 'Preparing download…' : 'Download CSV'}
        </button>
      </div>
    </dialog>
  );
}
