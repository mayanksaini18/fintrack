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
  Area,
  AreaChart,
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-xl shadow-zinc-200/60 dark:shadow-black/40 p-4 min-w-[170px]">
      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] mb-3">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-6 mb-2 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const LINES = [
  { key: 'balance',  name: 'Balance',  color: '#6366f1' },
  { key: 'income',   name: 'Income',   color: '#10b981' },
  { key: 'expenses', name: 'Expenses', color: '#f43f5e' },
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
  const axisColor = isDark ? '#3f3f46' : '#d4d4d8';
  const gridColor = isDark ? '#18181b' : '#f4f4f5';

  const rangeLabel = range === '1m' ? 'Last 4 weeks' : range === '6m' ? 'Last 6 months' : 'Last 12 months';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2 hover:shadow-md" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Balance Trend</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4">
            {LINES.map((l) => (
              <div key={l.key} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{l.name}</span>
              </div>
            ))}
          </div>
          {/* Range toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150 ${
                  range === r.value
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <filter id="glow-indigo">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? '#27272a' : '#e4e4e7', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
          {LINES.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              strokeWidth={l.key === 'balance' ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: l.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
