import { describe, expect, it } from 'vitest';
import { exportSchema, transactionQuerySchema } from '@loopr/contracts';
import { buildFilter, buildSort, toMinor } from '../../apps/api/src/modules/transactions/query.js';
import { createCsv, safeCsvText } from '../../apps/api/src/modules/transactions/export.js';

describe('financial filtering boundaries', () => {
  it('converts decimal strings exactly and includes the entire final UTC day', () => {
    expect(toMinor('1200.50')).toBe(120050);
    expect(toMinor('0.01')).toBe(1);
    expect(toMinor('0.1')).toBe(10);
    const query = transactionQuerySchema.parse({
      dateFrom: '2024-02-01',
      dateTo: '2024-02-29',
      amountMin: '0.01',
    });
    expect(buildFilter(query)).toMatchObject({
      date: { $gte: new Date('2024-02-01T00:00:00Z'), $lt: new Date('2024-03-01T00:00:00Z') },
      amountMinor: { $gte: 1 },
    });
  });
  it('rejects inverted ranges and invalid dates', () => {
    for (const query of [
      { dateFrom: '2024-02-30' },
      { dateFrom: '2024-03-01', dateTo: '2024-02-01' },
      { amountMin: '100', amountMax: '10' },
      { amountMin: '1.001' },
      { amountMax: 'Infinity' },
    ])
      expect(transactionQuerySchema.safeParse(query).success).toBe(false);
  });
  it('adds a deterministic tie-breaker and treats regex characters literally', () => {
    expect(
      buildSort(transactionQuerySchema.parse({ sortBy: 'amountMinor', sortOrder: 'asc' })),
    ).toEqual({ amountMinor: 1, id: 1 });
    const filter = buildFilter(transactionQuerySchema.parse({ search: '.*' }));
    const regex = filter.$or?.[0]?.userId;
    expect(regex).toBeInstanceOf(RegExp);
    expect((regex as RegExp).test('user_001')).toBe(false);
    expect((regex as RegExp).test('literal .* text')).toBe(true);
  });
});

describe('CSV contract and spreadsheet safety', () => {
  it('rejects missing, duplicate and unknown columns', () => {
    for (const columns of [[], ['id', 'id'], ['passwordHash']])
      expect(exportSchema.safeParse({ query: {}, columns }).success).toBe(false);
  });
  it('neutralizes formula-like text, preserving ordinary values', () => {
    for (const text of ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '\tcommand', '  =HYPERLINK("x")'])
      expect(safeCsvText(text)).toBe(`'${text}`);
    expect(safeCsvText('user_001')).toBe('user_001');
  });
  it('preserves requested order, exact decimals, Unicode and CSV quoting', () => {
    const csv = createCsv(
      [
        {
          id: 1,
          date: new Date('2024-01-01T00:00:00Z'),
          amountMinor: 120050,
          category: 'Revenue',
          status: 'Paid',
          userId: 'User, "Å"\nLine',
        },
      ],
      ['userId', 'amount', 'id'],
    );
    expect(csv).toBe(
      '\uFEFFUser ID,Amount (USD),Transaction ID\r\n"User, ""Å""\nLine",1200.50,1\r\n',
    );
  });
});
