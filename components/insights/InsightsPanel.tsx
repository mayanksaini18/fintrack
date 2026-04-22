'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Wallet,
  Receipt,
  PiggyBank,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useTheme } from '@/components/layout/ThemeProvider';

interface InsightsData {
  empty: boolean;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
    dailyAvgSpending: number;
    incomeExpenseRatio: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    txCount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
    percentage: number;
    avgPerMonth: number;
  }>;
  categoryTrends: Array<{
    category: string;
    current: number;
    previous: number;
    change: number;
  }>;
  topExpenses: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  incomeSources: Array<{
    source: string;
    total: number;
    percentage: number;
  }>;
  weekdaySpending: Array<{
    day: string;
    total: number;
    count: number;
    avg: number;
  }>;
}

const BAR_COLORS = ['bg-zinc-900 dark:bg-violet-500', 'bg-zinc-500 dark:bg-violet-400/60', 'bg-zinc-300 dark:bg-violet-300/30'];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:glass-strong rounded-xl shadow-lg dark:shadow-black/40 p-3 min-w-[140px]">
      <p className="text-[11px] font-medium text-zinc-400 dark:text-white/35 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-4 mb-1 last:mb-0">
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

export default function InsightsPanel() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
        <p className="text-sm font-medium">No data to analyze yet.</p>
        <p className="text-xs mt-1">Add some transactions to see insights.</p>
      </div>
    );
  }

  const { summary, monthlyBreakdown, categoryBreakdown, categoryTrends, topExpenses, incomeSources, weekdaySpending } = data;
  const currentMonth = monthlyBreakdown[monthlyBreakdown.length - 1];
  const lastMonth = monthlyBreakdown[monthlyBreakdown.length - 2];

  const incomeChange = lastMonth?.income > 0 ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100 : 0;
  const expenseChange = lastMonth?.expenses > 0 ? ((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100 : 0;
  const savingsTrend = currentMonth.savingsRate - (lastMonth?.savingsRate ?? 0);

  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : '#a1a1aa';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5';

  const cardBase = 'bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] px-5 py-4 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-2 dark:hover:border-white/[0.14]';
  const labelBase = 'text-[11px] font-medium text-zinc-400 dark:text-white/35 uppercase tracking-widest mb-3';
  const valueBase = 'text-[26px] font-semibold text-zinc-900 dark:text-white tabular-nums leading-none tracking-tight';

  const highestSpendDay = [...weekdaySpending].sort((a, b) => b.avg - a.avg)[0];
  const lowestSpendDay = [...weekdaySpending].filter(d => d.count > 0).sort((a, b) => a.avg - b.avg)[0];

  return (
    <div className="space-y-3">
      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: 'Net Savings',
            value: formatCurrency(summary.netSavings),
            icon: PiggyBank,
            sub: summary.netSavings >= 0 ? 'You\'re in the green' : 'Spending exceeds income',
            positive: summary.netSavings >= 0,
          },
          {
            label: 'Income This Month',
            value: formatCurrency(currentMonth.income),
            icon: Wallet,
            trend: incomeChange,
            sub: 'vs last month',
            positive: incomeChange >= 0,
          },
          {
            label: 'Expenses This Month',
            value: formatCurrency(currentMonth.expenses),
            icon: Receipt,
            trend: expenseChange,
            sub: 'vs last month',
            positive: expenseChange <= 0,
          },
          {
            label: 'Daily Avg Spending',
            value: formatCurrency(summary.dailyAvgSpending),
            icon: CalendarDays,
            sub: `across ${summary.transactionCount} transactions`,
            positive: true,
          },
        ].map((card, i) => (
          <div key={card.label} className={cardBase} style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className={labelBase.replace(' mb-3', '')}>{card.label}</p>
              <card.icon className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className={valueBase}>{card.value}</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              {card.trend !== undefined && (
                <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', card.positive ? 'text-emerald-600' : 'text-rose-500')}>
                  {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(card.trend).toFixed(1)}%
                </span>
              )}
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Savings Rate + Income/Expense Ratio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={cardBase} style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Savings Rate</p>
          <p className={valueBase}>{currentMonth.savingsRate}%</p>
          <div className={cn('flex items-center gap-1 text-[11px] mt-2.5 font-medium', savingsTrend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
            {savingsTrend > 0 ? <TrendingUp className="w-3 h-3" /> : savingsTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {savingsTrend > 0 ? '+' : ''}{savingsTrend.toFixed(1)}pp vs last month
          </div>
        </div>

        <div className={cardBase} style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Income / Expense</p>
          <p className={valueBase}>{summary.incomeExpenseRatio}x</p>
          <p className={cn('text-[11px] mt-2.5 font-medium',
            summary.incomeExpenseRatio >= 1.2 ? 'text-emerald-600' : summary.incomeExpenseRatio >= 1 ? 'text-amber-500' : 'text-rose-500'
          )}>
            {summary.incomeExpenseRatio >= 1.2 ? 'Healthy surplus' : summary.incomeExpenseRatio >= 1 ? 'Near break-even' : 'Spending exceeds income'}
          </p>
        </div>

        <div className={cardBase} style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Spending Pattern</p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            You spend most on <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{highestSpendDay?.day}s</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">
            Avg {formatCurrency(highestSpendDay?.avg ?? 0)} per transaction
          </p>
          {lowestSpendDay && lowestSpendDay.day !== highestSpendDay?.day && (
            <p className="text-xs text-emerald-600 mt-1">
              Lowest: {lowestSpendDay.day}s — {formatCurrency(lowestSpendDay.avg)} avg
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Monthly Savings Trend Chart */}
      <div className={cardBase} style={{ animationDelay: '420ms', animationFillMode: 'both' }}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Monthly Savings Trend</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Income vs Expenses over 6 months</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { name: 'Income', color: '#10b981' },
              { name: 'Expenses', color: '#f43f5e' },
              { name: 'Savings', color: isDark ? '#e4e4e7' : '#18181b' },
            ].map(l => (
              <div key={l.name} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-zinc-400">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyBreakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Savings Rate Line + Weekday Spending */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className={cardBase} style={{ animationDelay: '480ms', animationFillMode: 'both' }}>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Savings Rate Over Time</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Monthly savings as % of income</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyBreakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} width={36} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Savings Rate']}
                contentStyle={{ background: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '12px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="savingsRate" stroke="#10b981" strokeWidth={2} dot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={cardBase} style={{ animationDelay: '540ms', animationFillMode: 'both' }}>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Spending by Day of Week</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Average spend per transaction</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekdaySpending} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }} />
              <Bar dataKey="avg" name="Avg Spend" fill={isDark ? '#a1a1aa' : '#3f3f46'} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Category Trends + Top Expenses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Category Trends */}
        <div className={cardBase} style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Category Trends (vs Last Month)</p>
          {categoryTrends.length === 0 ? (
            <p className="text-xs text-zinc-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryTrends.filter(t => t.current > 0 || t.previous > 0).slice(0, 6).map((trend) => (
                <div key={trend.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{trend.category}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-400 tabular-nums">{formatCurrency(trend.current)}</span>
                    {trend.change !== 0 ? (
                      <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums min-w-[60px] justify-end',
                        trend.change > 0 ? 'text-rose-500' : 'text-emerald-600'
                      )}>
                        {trend.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend.change)}%
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 min-w-[60px] text-right">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Expenses */}
        <div className={cardBase} style={{ animationDelay: '660ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Biggest Expenses (All Time)</p>
          <div className="space-y-3">
            {topExpenses.map((tx, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-300 dark:text-zinc-600 tabular-nums w-3">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{tx.description}</p>
                    <p className="text-[11px] text-zinc-400">{tx.category} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 6: Top Category Breakdown + Income Sources */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className={cardBase} style={{ animationDelay: '720ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Expense Categories</p>
          <div className="space-y-4">
            {categoryBreakdown.slice(0, 5).map((cat, i) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold text-zinc-300 dark:text-zinc-600 tabular-nums w-3">{i + 1}</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400 tabular-nums">{cat.percentage}%</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums w-20 text-right">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    className={cn('h-1.5 rounded-full', BAR_COLORS[i] ?? 'bg-zinc-200 dark:bg-zinc-700')}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  {cat.count} transactions · {formatCurrency(cat.avgPerMonth)}/month avg
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={cardBase} style={{ animationDelay: '780ms', animationFillMode: 'both' }}>
          <p className={labelBase}>Income Sources</p>
          <div className="space-y-4">
            {incomeSources.map((src) => (
              <div key={src.source} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{src.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400 tabular-nums">{src.percentage}%</span>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums w-20 text-right">
                      {formatCurrency(src.total)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${src.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
