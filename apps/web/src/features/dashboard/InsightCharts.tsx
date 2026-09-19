import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Analytics } from '@loopr/contracts';
import { ui } from '../../components/ui';
import { money, shortMoney } from './format';
import { monthlySeries } from './monthlySeries';

function useMotion() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(!preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return enabled;
}

const tooltip = {
  background: '#20242d',
  border: '1px solid #424958',
  borderRadius: 12,
  color: '#fff',
  boxShadow: '0 12px 30px #0004',
};
const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });

export default function InsightCharts({ analytics }: { analytics: Analytics }) {
  const animate = useMotion();
  let cumulative = 0;
  const months = monthlySeries(analytics.monthly).map((point) => {
    const net = point.revenueMinor - point.expenseMinor;
    cumulative += net;
    return { ...point, net, cumulative };
  });
  const settlement = [
    { name: 'Incoming', paid: analytics.paidRevenueMinor, pending: analytics.pendingRevenueMinor },
    { name: 'Outgoing', paid: analytics.paidExpenseMinor, pending: analytics.pendingExpenseMinor },
  ];
  const cards = [
    {
      title: 'Monthly surplus & deficit',
      description: 'Paid income minus expenses each month',
      value: money(analytics.netCashFlowMinor),
      tag: 'Net cash flow',
    },
    {
      title: 'Cumulative cash flow',
      description: 'Running total from the first filtered month',
      value: money(cumulative),
      tag: 'Period total',
    },
    {
      title: 'Payment settlement',
      description: 'Compare settled and outstanding amounts',
      value: String(analytics.pendingCount),
      tag: 'Pending records',
    },
  ];
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      {cards.map((card, index) => (
        <section
          key={card.title}
          className={`${ui.panel} min-w-0 border border-white/5 ${index === 2 ? 'lg:col-span-2' : ''}`}
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-1 text-xs text-muted">{card.description}</p>
            </div>
            <div className="rounded-xl bg-white/5 px-3 py-2">
              <p className="text-[10px] text-muted">{card.tag}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{card.value}</p>
            </div>
          </div>
          <div
            className="h-64 min-w-0"
            role="img"
            aria-label={`${card.title}. ${card.description}. ${card.tag}: ${card.value}`}
          >
            {index < 2 && !months.length ? (
              <p className="grid h-full place-items-center text-sm text-muted">
                No paid activity in this selection.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {index === 0 ? (
                  <BarChart
                    data={months}
                    accessibilityLayer
                    margin={{ right: 12, left: 0, top: 8 }}
                  >
                    <CartesianGrid vertical={false} stroke="#343842" strokeDasharray="3 6" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={monthLabel}
                      tick={{ fontSize: 10, fill: '#999ca5' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      width={62}
                      tickFormatter={shortMoney}
                      tick={{ fontSize: 11, fill: '#999ca5' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine y={0} stroke="#727887" />
                    <Tooltip
                      contentStyle={tooltip}
                      cursor={{ fill: '#ffffff05' }}
                      formatter={(value) => money(Number(value))}
                      labelFormatter={(label) => monthLabel(String(label))}
                    />
                    <Bar
                      dataKey="net"
                      name="Net cash flow"
                      radius={[4, 4, 4, 4]}
                      maxBarSize={32}
                      isAnimationActive={animate}
                      animationDuration={450}
                      animationEasing="ease-out"
                    >
                      {months.map((month) => (
                        <Cell key={month.month} fill={month.net >= 0 ? '#1dce57' : '#ffc21a'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : index === 1 ? (
                  <AreaChart
                    data={months}
                    accessibilityLayer
                    margin={{ right: 12, left: 0, top: 8 }}
                  >
                    <defs>
                      <linearGradient id="cash-flow-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#343842" strokeDasharray="3 6" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={monthLabel}
                      tick={{ fontSize: 10, fill: '#999ca5' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      width={62}
                      tickFormatter={shortMoney}
                      tick={{ fontSize: 11, fill: '#999ca5' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine y={0} stroke="#727887" />
                    <Tooltip
                      contentStyle={tooltip}
                      formatter={(value) => money(Number(value))}
                      labelFormatter={(label) => monthLabel(String(label))}
                    />
                    <Area
                      dataKey="cumulative"
                      name="Cumulative net"
                      type="linear"
                      stroke="#a5b4fc"
                      strokeWidth={2.5}
                      fill="url(#cash-flow-fill)"
                      isAnimationActive={animate}
                      animationDuration={450}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={settlement}
                    layout="vertical"
                    accessibilityLayer
                    margin={{ right: 24, left: 0, top: 12 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#343842" strokeDasharray="3 6" />
                    <XAxis
                      type="number"
                      tickFormatter={shortMoney}
                      tick={{ fontSize: 11, fill: '#999ca5' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={76}
                      tick={{ fontSize: 12, fill: '#c4c8d0' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      cursor={{ fill: '#ffffff05' }}
                      formatter={(value) => money(Number(value))}
                    />
                    <Bar
                      dataKey="paid"
                      name="Paid"
                      stackId="settlement"
                      fill="#1dce57"
                      maxBarSize={36}
                      isAnimationActive={animate}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      stackId="settlement"
                      fill="#ffc21a"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={36}
                      isAnimationActive={animate}
                      animationDuration={450}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
          {index === 2 && (
            <div className="mt-3 flex justify-center gap-6 text-xs text-muted">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-accent" />
                Paid
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-expense" />
                Pending
              </span>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
