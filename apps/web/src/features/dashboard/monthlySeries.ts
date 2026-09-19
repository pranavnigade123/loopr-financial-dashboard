import type { Analytics } from '@loopr/contracts';

// Preserve empty months so every chart uses the same continuous time axis.
export function monthlySeries(monthly: Analytics['monthly']): Analytics['monthly'] {
  const sorted = [...monthly].sort((a, b) => a.month.localeCompare(b.month));
  const first = sorted[0]?.month;
  const last = sorted.at(-1)?.month;
  if (!first || !last) return [];
  const byMonth = new Map(sorted.map((point) => [point.month, point]));
  const points: Analytics['monthly'] = [];
  const cursor = new Date(`${first}-01T00:00:00Z`);
  for (let count = 0; cursor.toISOString().slice(0, 7) <= last && count < 1200; count++) {
    const month = cursor.toISOString().slice(0, 7);
    points.push(byMonth.get(month) ?? { month, revenueMinor: 0, expenseMinor: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return points;
}
