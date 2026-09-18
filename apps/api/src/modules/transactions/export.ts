import { stringify } from 'csv-stringify/sync';
import type { ExportColumn } from '@loopr/contracts';
import type { TransactionRecord } from '../../db/database.js';

const headers: Record<ExportColumn, string> = {
  id: 'Transaction ID',
  date: 'Date (UTC)',
  amount: 'Amount (USD)',
  category: 'Category',
  status: 'Status',
  userId: 'User ID',
};
export function safeCsvText(value: string): string {
  return /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
}
export function createCsv(rows: TransactionRecord[], columns: ExportColumn[]): string {
  return stringify(
    rows.map((row) =>
      columns.map((column) => {
        if (column === 'amount') return (row.amountMinor / 100).toFixed(2);
        if (column === 'date') return row.date.toISOString();
        const value = row[column];
        return typeof value === 'string' ? safeCsvText(value) : value;
      }),
    ),
    {
      header: true,
      columns: columns.map((column) => headers[column]),
      bom: true,
      record_delimiter: '\r\n',
    },
  );
}
