'use client';

import { useFinanceStore } from '@/lib/store';
import { formatCurrency, getBalance, getMonthlyData } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SummaryCards() {
  const { transactions } = useFinanceStore();

  const monthlyData = getMonthlyData(transactions);
  const currentMonth = monthlyData[monthlyData.length - 1];
  const lastMonth = monthlyData[monthlyData.length - 2];

  const totalBalance = getBalance(transactions);
  const savingsRate =
    currentMonth.income > 0
      ? ((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100
      : 0;
  const incomeTrend =
    lastMonth.income > 0
      ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100
      : 0;
  const expenseTrend =
    lastMonth.expenses > 0
      ? ((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100
      : 0;
  const lastSavingsRate =
    lastMonth.income > 0
      ? ((lastMonth.income - lastMonth.expenses) / lastMonth.income) * 100
      : 0;
  const savingsTrend = savingsRate - lastSavingsRate;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Total Balance — hero card */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 shadow-xl shadow-indigo-500/20 animate-in fade-in-0 slide-in-from-bottom-2"
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCA0MEw0MCAwTTAgMEw0MCA0ME0tMTAgMTBMMTAgLTEwTTMwIDUwTDUwIDMwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNikiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.12em]">Total Balance</p>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-[11px] text-white/50 mt-2.5">All time net balance</p>
        </div>
      </div>

      {/* Monthly Income */}
      <MetricCard
        label="Monthly Income"
        value={formatCurrency(currentMonth.income)}
        trend={incomeTrend}
        trendPositive={incomeTrend >= 0}
        sub="vs last month"
        icon={ArrowUpRight}
        accentClass="bg-emerald-500/10 dark:bg-emerald-500/10"
        iconClass="text-emerald-600 dark:text-emerald-400"
        borderClass="border-emerald-200/60 dark:border-emerald-500/20"
        delay={60}
      />

      {/* Monthly Expenses */}
      <MetricCard
        label="Monthly Expenses"
        value={formatCurrency(currentMonth.expenses)}
        trend={expenseTrend}
        trendPositive={expenseTrend <= 0}
        sub="vs last month"
        icon={ArrowDownRight}
        accentClass="bg-rose-500/10 dark:bg-rose-500/10"
        iconClass="text-rose-600 dark:text-rose-400"
        borderClass="border-rose-200/60 dark:border-rose-500/20"
        delay={120}
      />

      {/* Savings Rate */}
      <MetricCard
        label="Savings Rate"
        value={`${savingsRate.toFixed(1)}%`}
        trend={savingsTrend}
        trendPositive={savingsTrend >= 0}
        sub="vs last month"
        icon={PiggyBank}
        accentClass="bg-amber-500/10 dark:bg-amber-500/10"
        iconClass="text-amber-600 dark:text-amber-400"
        borderClass="border-amber-200/60 dark:border-amber-500/20"
        delay={180}
      />
    </div>
  );
}

function MetricCard({
  label, value, trend, trendPositive, sub,
  icon: Icon, accentClass, iconClass, borderClass, delay,
}: {
  label: string;
  value: string;
  trend: number;
  trendPositive: boolean;
  sub: string;
  icon: React.ElementType;
  accentClass: string;
  iconClass: string;
  borderClass: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-zinc-900 rounded-2xl border p-5 hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2',
        borderClass
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em]">{label}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', accentClass)}>
          <Icon className={cn('w-4 h-4', iconClass)} />
        </div>
      </div>
      <p className="text-[26px] font-bold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight leading-none">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className={cn(
          'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md',
          trendPositive
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
        )}>
          {trendPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</span>
      </div>
    </div>
  );
}
