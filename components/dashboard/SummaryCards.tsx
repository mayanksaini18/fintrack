'use client';

import { useFinanceStore } from '@/lib/store';
import {
  formatCurrency,
  getBalance,
  getMonthlyData,
} from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
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

  const cards = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      trend: null as number | null,
      trendPositive: true,
      sub: 'All time',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(currentMonth.income),
      trend: incomeTrend,
      trendPositive: incomeTrend >= 0,
      sub: 'vs last month',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(currentMonth.expenses),
      trend: expenseTrend,
      trendPositive: expenseTrend <= 0,
      sub: 'vs last month',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      trend: savingsTrend,
      trendPositive: savingsTrend >= 0,
      sub: 'vs last month',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const hasTrend = card.trend !== null;
        return (
          <div
            key={card.label}
            className="bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] px-5 py-4 hover:border-zinc-300 dark:hover:border-white/[0.14] transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
          >
            <p className="text-[11px] font-medium text-zinc-400 dark:text-white/40 uppercase tracking-widest mb-3">
              {card.label}
            </p>
            <p className="text-[26px] font-semibold text-zinc-900 dark:text-white tabular-nums leading-none tracking-tight">
              {card.value}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5">
              {hasTrend ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
                    card.trendPositive
                      ? 'text-emerald-400 dark:bg-emerald-500/10'
                      : 'text-rose-500 dark:bg-rose-500/10'
                  )}
                >
                  {card.trendPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(card.trend ?? 0).toFixed(1)}%
                </span>
              ) : null}
              <span className="text-[11px] text-zinc-400 dark:text-white/30">{card.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
