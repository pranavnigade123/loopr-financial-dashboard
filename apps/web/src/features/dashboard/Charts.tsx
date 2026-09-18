import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Analytics } from '@loopr/contracts';
import { money, shortMoney } from './format';

const green = '#1dce57';
const yellow = '#ffc21a';
const tooltipStyle = {
  background: '#252831',
  border: '1px solid #454a56',
  borderRadius: 10,
  color: '#f4f5f7',
};

export function TrendChart({ analytics }: { analytics: Analytics }) {
  const byMonth = new Map(analytics.monthly.map((point) => [point.month, point]));
  const points: Analytics['monthly'] = [];
  const first = analytics.monthly[0]?.month;
  const last = analytics.monthly.at(-1)?.month;
  if (first && last) {
    const cursor = new Date(`${first}-01T00:00:00Z`);
    for (let count = 0; cursor.toISOString().slice(0, 7) <= last && count < 1200; count++) {
      const month = cursor.toISOString().slice(0, 7);
      points.push(byMonth.get(month) ?? { month, revenueMinor: 0, expenseMinor: 0 });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  if (!analytics.paidRevenueMinor && !analytics.paidExpenseMinor)
    return <div className="chart-empty">No paid activity matches these filters.</div>;
  return (
    <div
      className="h-72 w-full min-w-0"
      role="img"
      aria-label={`Monthly paid revenue and expenses. Revenue ${money(analytics.paidRevenueMinor)}; expenses ${money(analytics.paidExpenseMinor)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#343842" strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#999eaa"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) =>
              new Date(`${value}-01T00:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                timeZone: 'UTC',
              })
            }
            minTickGap={24}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#999eaa"
            tickLine={false}
            axisLine={false}
            tickFormatter={shortMoney}
            tick={{ fontSize: 11 }}
            width={58}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => money(Number(value))}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingBottom: 20 }}
          />
          <Line
            name="Revenue"
            type="linear"
            dataKey="revenueMinor"
            stroke={green}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            name="Expenses"
            type="linear"
            dataKey="expenseMinor"
            stroke={yellow}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ analytics }: { analytics: Analytics }) {
  const values = [
    { name: 'Revenue', value: analytics.paidRevenueMinor },
    { name: 'Expense', value: analytics.paidExpenseMinor },
  ];
  if (!values.some((entry) => entry.value))
    return <div className="chart-empty">No paid category totals to display.</div>;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="h-44 w-44 shrink-0"
        role="img"
        aria-label={`Revenue ${money(values[0]!.value)}, expenses ${money(values[1]!.value)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={values}
              dataKey="value"
              innerRadius={55}
              outerRadius={77}
              paddingAngle={4}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={green} />
              <Cell fill={yellow} />
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-5">
        {values.map((entry, index) => (
          <div key={entry.name}>
            <p className="mb-1 flex items-center gap-2 text-xs text-muted">
              <span className={`size-2 rounded-full ${index ? 'bg-expense' : 'bg-accent'}`} />
              {entry.name}
            </p>
            <p className="text-lg font-semibold tabular-nums">{money(entry.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
