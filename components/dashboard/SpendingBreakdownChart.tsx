'use client';

import { useFinanceStore } from '@/lib/store';
import { getCategoryBreakdown, formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PALETTE = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16',
  '#ec4899', '#14b8a6',
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { percentage: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-xl p-3.5">
      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {formatCurrency(item.value)} · {item.payload.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

export default function SpendingBreakdownChart() {
  const { transactions } = useFinanceStore();
  const breakdown = getCategoryBreakdown(transactions);

  if (breakdown.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col h-full transition-colors duration-200">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Spending</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 mb-4">By category</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-400">No expense data yet</p>
        </div>
      </div>
    );
  }

  const top = breakdown.slice(0, 6);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2 hover:shadow-md" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Spending</p>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 mb-5">By category this month</p>

      <div className="flex justify-center mb-6">
        <ResponsiveContainer width={168} height={168}>
          <PieChart>
            <Pie
              data={top}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={3}
              strokeWidth={0}
            >
              {top.map((entry, index) => (
                <Cell key={entry.category} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {top.map((item, index) => (
          <div key={item.category} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-medium">{item.category}</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div className="mt-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
