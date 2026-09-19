import { ui } from '../../../components/ui';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { TransactionRows, SortableHeading } from '../TransactionTable';
import { pageStack, pageHeading, tableWrap, type PageProps } from '../pageTypes';
import { Filters } from '../Filters';
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
