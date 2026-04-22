import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction } from '@/types';
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getBalance(transactions: Transaction[]): number {
  return getTotalIncome(transactions) - getTotalExpenses(transactions);
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export function getMonthlyData(transactions: Transaction[], monthCount = 6): MonthlyData[] {
  const today = new Date();
  const months: MonthlyData[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const monthTransactions = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start, end })
    );

    const income = getTotalIncome(monthTransactions);
    const expenses = getTotalExpenses(monthTransactions);

    months.push({
      month: format(monthDate, monthCount > 6 ? 'MMM yy' : 'MMM yyyy'),
      income,
      expenses,
      balance: income - expenses,
    });
  }

  return months;
}

export function getWeeklyData(transactions: Transaction[]): MonthlyData[] {
  const today = new Date();
  const weeks: MonthlyData[] = [];

  for (let i = 3; i >= 0; i--) {
    const weekDate = subWeeks(today, i);
    const start = startOfWeek(weekDate, { weekStartsOn: 1 });
    const end = endOfWeek(weekDate, { weekStartsOn: 1 });

    const weekTransactions = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start, end })
    );

    const income = getTotalIncome(weekTransactions);
    const expenses = getTotalExpenses(weekTransactions);

    weeks.push({
      month: format(start, 'MMM d'),
      income,
      expenses,
      balance: income - expenses,
    });
  }

  return weeks;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export function getCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = getTotalExpenses(expenses);

  const categoryTotals: Record<string, number> = {};
  for (const t of expenses) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }

  return Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
