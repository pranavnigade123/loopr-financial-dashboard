import { ArrowDown, ArrowUp, ArrowUpDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '@loopr/contracts';
import { ui } from '../../components/ui';
import { displayDate, money } from './format';
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
export function TransactionRows({ items }: { items: Transaction[] }) {
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
export function SortableHeading({
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
