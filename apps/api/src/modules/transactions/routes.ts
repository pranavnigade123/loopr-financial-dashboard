import type { FastifyInstance } from 'fastify';
import { transactionQuerySchema, exportSchema, type Analytics } from '@loopr/contracts';
import type { Database } from '../../db/database.js';
import { buildFilter, buildSort } from './query.js';
import { createCsv } from './export.js';

export function registerTransactionRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/transactions', async (request) => {
    const query = transactionQuerySchema.parse(request.query);
    const filter = buildFilter(query);
    const [rows, total] = await Promise.all([
      db.transactions
        .find(filter, { projection: { _id: 0 } })
        .sort(buildSort(query))
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .toArray(),
      db.transactions.countDocuments(filter),
    ]);
    return {
      items: rows.map((row) => ({ ...row, date: row.date.toISOString() })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  });

  app.get('/api/transactions/metadata', async () => {
    const [users, first, last] = await Promise.all([
      db.transactions.distinct('userId'),
      db.transactions.findOne({}, { sort: { date: 1 } }),
      db.transactions.findOne({}, { sort: { date: -1 } }),
    ]);
    return {
      users: users.sort(),
      dateFrom: first?.date.toISOString().slice(0, 10) ?? null,
      dateTo: last?.date.toISOString().slice(0, 10) ?? null,
    };
  });

  app.get('/api/analytics', async (request): Promise<Analytics> => {
    const query = transactionQuerySchema.parse(request.query);
    const sumWhen = (category: string, status: string) => ({
      $sum: {
        $cond: [
          { $and: [{ $eq: ['$category', category] }, { $eq: ['$status', status] }] },
          '$amountMinor',
          0,
        ],
      },
    });
    const result = await db.transactions
      .aggregate<{
        totals: {
          total: number;
          paidRevenueMinor: number;
          paidExpenseMinor: number;
          pendingCount: number;
          pendingRevenueMinor: number;
          pendingExpenseMinor: number;
        }[];
        monthly: { month: string; revenueMinor: number; expenseMinor: number }[];
      }>([
        { $match: buildFilter(query) },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  paidRevenueMinor: sumWhen('Revenue', 'Paid'),
                  paidExpenseMinor: sumWhen('Expense', 'Paid'),
                  pendingRevenueMinor: sumWhen('Revenue', 'Pending'),
                  pendingExpenseMinor: sumWhen('Expense', 'Pending'),
                  pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                },
              },
            ],
            monthly: [
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } },
                  revenueMinor: sumWhen('Revenue', 'Paid'),
                  expenseMinor: sumWhen('Expense', 'Paid'),
                },
              },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, month: '$_id', revenueMinor: 1, expenseMinor: 1 } },
            ],
          },
        },
      ])
      .next();
    const totals = result?.totals[0] ?? {
      total: 0,
      paidRevenueMinor: 0,
      paidExpenseMinor: 0,
      pendingCount: 0,
      pendingRevenueMinor: 0,
      pendingExpenseMinor: 0,
    };
    return {
      total: totals.total,
      paidRevenueMinor: totals.paidRevenueMinor,
      paidExpenseMinor: totals.paidExpenseMinor,
      pendingCount: totals.pendingCount,
      pendingRevenueMinor: totals.pendingRevenueMinor,
      pendingExpenseMinor: totals.pendingExpenseMinor,
      netCashFlowMinor: totals.paidRevenueMinor - totals.paidExpenseMinor,
      monthly: result?.monthly ?? [],
    };
  });

  app.post(
    '/api/exports',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { query, columns } = exportSchema.parse(request.body);
      // Bound memory for synchronous exports; pagination is intentionally ignored.
      const rows = await db.transactions
        .find(buildFilter(query))
        .sort(buildSort(query))
        .limit(10001)
        .toArray();
      if (rows.length > 10000)
        return reply.code(422).send({
          error: {
            code: 'EXPORT_TOO_LARGE',
            message: 'Narrow the filters to export at most 10,000 transactions.',
            requestId: request.id,
          },
        });
      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header(
          'Content-Disposition',
          `attachment; filename="penta-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
        );
      return createCsv(rows, columns);
    },
  );
}
