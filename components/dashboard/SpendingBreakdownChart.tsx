'use client';

import { useFinanceStore } from '@/lib/store';
import { getCategoryBreakdown, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/components/layout/ThemeProvider';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const COLORS = [
  '#18181b', '#3f3f46', '#71717a', '#a1a1aa',
  '#6366f1', '#10b981', '#f59e0b', '#f43f5e',
  '#3b82f6', '#8b5cf6',
];

const COLORS_DARK = [
  '#a78bfa', '#34d399', '#fb7185', '#fbbf24',
  '#60a5fa', '#818cf8', '#f472b6', '#4ade80',
  '#38bdf8', '#c084fc',
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { percentage: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:glass-strong rounded-xl shadow-lg dark:shadow-black/40 px-3.5 py-2.5">
      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {formatCurrency(item.value)} · {item.payload.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

export default function SpendingBreakdownChart() {
  const { transactions } = useFinanceStore();
  const { theme } = useTheme();
  const breakdown = getCategoryBreakdown(transactions);
  const isDark = theme === 'dark';
  const palette = isDark ? COLORS_DARK : COLORS;

  if (breakdown.length === 0) {
    return (
      <div className="bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] p-5 flex flex-col h-full transition-colors duration-200">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Spending</p>
        <p className="text-xs text-zinc-400 dark:text-white/40">By category</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-400">No expense data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] p-5 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
      <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Spending</p>
      <p className="text-xs text-zinc-400 dark:text-white/40 mb-5">By category</p>

      <div className="flex justify-center mb-5">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={breakdown}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              strokeWidth={0}
            >
              {breakdown.map((entry, index) => (
                <Cell key={entry.category} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2.5">
        {breakdown.map((item, index) => (
          <div key={item.category} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span className="text-xs text-zinc-600 dark:text-white/60 truncate">{item.category}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-zinc-400 dark:text-white/30 tabular-nums">
                {item.percentage.toFixed(0)}%
              </span>
              <span className="text-xs font-medium text-zinc-900 dark:text-white/85 tabular-nums w-16 text-right">
                {formatCurrency(item.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
