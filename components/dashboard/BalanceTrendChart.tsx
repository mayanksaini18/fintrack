'use client';

import { useFinanceStore } from '@/lib/store';
import { getMonthlyData, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/components/layout/ThemeProvider';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg shadow-zinc-100/50 p-3.5 min-w-[160px]">
      <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-6 mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const LINES = [
  { key: 'balance', name: 'Balance', colorLight: '#18181b', colorDark: '#e4e4e7' },
  { key: 'income', name: 'Income', colorLight: '#10b981', colorDark: '#10b981' },
  { key: 'expenses', name: 'Expenses', colorLight: '#f43f5e', colorDark: '#f43f5e' },
];

export default function BalanceTrendChart() {
  const { transactions } = useFinanceStore();
  const { theme } = useTheme();
  const monthlyData = getMonthlyData(transactions);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#52525b' : '#a1a1aa';
  const gridColor = isDark ? '#27272a' : '#f4f4f5';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Balance Trend</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4">
          {LINES.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: isDark ? l.colorDark : l.colorLight }}
              />
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{l.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => v.split(' ')[0]}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? '#3f3f46' : '#e4e4e7', strokeWidth: 1 }} />
            {LINES.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={isDark ? l.colorDark : l.colorLight}
                strokeWidth={l.key === 'balance' ? 2 : 1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: isDark ? l.colorDark : l.colorLight }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
