import { expect, it } from 'vitest';
import { monthlySeries } from '../../apps/web/src/features/dashboard/monthlySeries';

it('fills inactive months across a year boundary without changing totals or input order', () => {
  const input = [
    { month: '2025-02', revenueMinor: 300, expenseMinor: 100 },
    { month: '2024-12', revenueMinor: 200, expenseMinor: 50 },
  ];
  expect(monthlySeries(input)).toEqual([
    input[1],
    { month: '2025-01', revenueMinor: 0, expenseMinor: 0 },
    input[0],
  ]);
  expect(input[0]?.month).toBe('2025-02');
  expect(monthlySeries([])).toEqual([]);
});
