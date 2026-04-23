'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/lib/store';
import { getMonthlyData, getWeeklyData, formatCurrency } from '@/lib/utils';
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

type Range = '1m' | '6m' | '1y';

const RANGES: { label: string; value: Range }[] = [
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
];

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
    <div className="bg-white dark:glass-strong rounded-xl shadow-lg dark:shadow-black/40 p-3.5 min-w-[160px]">
      <p className="text-[11px] font-medium text-zinc-400 dark:text-white/40 uppercase tracking-widest mb-2.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-6 mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-500 dark:text-white/50">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const LINES = [
  { key: 'balance', name: 'Balance', colorLight: '#18181b', colorDark: '#e4e4e7' },
  { key: 'income', name: 'Income', colorLight: '#10b981', colorDark: '#34d399' },
  { key: 'expenses', name: 'Expenses', colorLight: '#f43f5e', colorDark: '#fb7185' },
];

export default function BalanceTrendChart() {
  const { transactions } = useFinanceStore();
  const { theme } = useTheme();
  const [range, setRange] = useState<Range>('6m');

  const chartData =
    range === '1m'
      ? getWeeklyData(transactions)
      : getMonthlyData(transactions, range === '1y' ? 12 : 6);

  const isDark = theme === 'dark';
  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : '#a1a1aa';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5';

  const rangeLabel = range === '1m' ? 'Last 4 weeks' : range === '6m' ? 'Last 6 months' : 'Last 12 months';

  return (
    <div className="bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] p-5 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Balance Trend</p>
          <p className="text-xs text-zinc-400 dark:text-white/40 mt-0.5">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            {LINES.map((l) => (
              <div key={l.key} className="hidden sm:flex items-center gap-1.5">
                <div
                  className="w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: isDark ? l.colorDark : l.colorLight }}
                />
                <span className="text-[11px] text-zinc-400 dark:text-white/35">{l.name}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.03] p-0.5 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  range === r.value
                    ? 'bg-zinc-900 dark:bg-zinc-700 text-white'
                    : 'text-zinc-500 dark:text-white/40 hover:text-zinc-700 dark:hover:text-white/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
            <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              width={42}
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
