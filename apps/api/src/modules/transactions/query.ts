import type { Filter, Sort } from 'mongodb';
import type { TransactionQuery } from '@loopr/contracts';
import type { TransactionRecord } from '../../db/database.js';

export function toMinor(value: string): number {
  const [whole = '0', fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function buildFilter(query: TransactionQuery): Filter<TransactionRecord> {
  const filter: Filter<TransactionRecord> = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.userId) filter.userId = query.userId;
  if (query.dateFrom || query.dateTo) {
    filter.date = {
      ...(query.dateFrom ? { $gte: new Date(`${query.dateFrom}T00:00:00Z`) } : {}),
      ...(query.dateTo
        ? { $lt: new Date(new Date(`${query.dateTo}T00:00:00Z`).getTime() + 86400000) }
        : {}),
    };
  }
  if (query.amountMin || query.amountMax)
    filter.amountMinor = {
      ...(query.amountMin ? { $gte: toMinor(query.amountMin) } : {}),
      ...(query.amountMax ? { $lte: toMinor(query.amountMax) } : {}),
    };
  if (query.search) {
    // Literal search: never interpret user text as executable regex syntax.
    const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ userId: regex }, { category: regex }, { status: regex }];
    if (/^\d+$/.test(query.search)) filter.$or.push({ id: Number(query.search) });
    if (/^\d{1,9}(\.\d{1,2})?$/.test(query.search))
      filter.$or.push({ amountMinor: toMinor(query.search) });
    if (/^\d{4}-\d{2}-\d{2}$/.test(query.search) && !Number.isNaN(Date.parse(query.search))) {
      const start = new Date(`${query.search}T00:00:00Z`);
      filter.$or.push({ date: { $gte: start, $lt: new Date(start.getTime() + 86400000) } });
    }
  }
  return filter;
}

export function buildSort(query: TransactionQuery): Sort {
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  return query.sortBy === 'id' ? { id: direction } : { [query.sortBy]: direction, id: direction };
}
