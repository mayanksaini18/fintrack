import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const allTx = await db.select().from(transactions).orderBy(desc(transactions.date));

  if (allTx.length === 0) {
    return Response.json({ empty: true });
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  function getMonthStart(year: number, month: number) {
    return new Date(year, month, 1);
  }
  function getMonthEnd(year: number, month: number) {
    return new Date(year, month + 1, 0, 23, 59, 59, 999);
  }
  function isInMonth(date: Date, year: number, month: number) {
    return date.getFullYear() === year && date.getMonth() === month;
  }

  // Monthly breakdown for last 6 months
  const monthlyBreakdown = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthTx = allTx.filter(t => isInMonth(t.date, y, m));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    monthlyBreakdown.push({
      month: d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
      income,
      expenses,
      savings: income - expenses,
      savingsRate: Math.round(savingsRate * 10) / 10,
      txCount: monthTx.length,
    });
  }

  // Category breakdown (all time)
  const expenseTx = allTx.filter(t => t.type === 'expense');
  const totalExpenses = expenseTx.reduce((s, t) => s + t.amount, 0);
  const categoryMap: Record<string, { total: number; count: number; months: Set<string> }> = {};
  for (const t of expenseTx) {
    const key = t.category;
    if (!categoryMap[key]) categoryMap[key] = { total: 0, count: 0, months: new Set() };
    categoryMap[key].total += t.amount;
    categoryMap[key].count += 1;
    categoryMap[key].months.add(`${t.date.getFullYear()}-${t.date.getMonth()}`);
  }
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 1000) / 10 : 0,
      avgPerMonth: data.months.size > 0 ? Math.round(data.total / data.months.size) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Category trend (current month vs last month per category)
  const cm = monthlyBreakdown[monthlyBreakdown.length - 1];
  const lm = monthlyBreakdown[monthlyBreakdown.length - 2];
  const cmDate = new Date(currentYear, currentMonth, 1);
  const lmDate = new Date(currentYear, currentMonth - 1, 1);

  const categoryTrends: Array<{ category: string; current: number; previous: number; change: number }> = [];
  for (const cat of Object.keys(categoryMap)) {
    const currentCatTx = expenseTx.filter(t => t.category === cat && isInMonth(t.date, cmDate.getFullYear(), cmDate.getMonth()));
    const prevCatTx = expenseTx.filter(t => t.category === cat && isInMonth(t.date, lmDate.getFullYear(), lmDate.getMonth()));
    const current = currentCatTx.reduce((s, t) => s + t.amount, 0);
    const previous = prevCatTx.reduce((s, t) => s + t.amount, 0);
    const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
    categoryTrends.push({ category: cat, current, previous, change: Math.round(change * 10) / 10 });
  }
  categoryTrends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Top transactions
  const topExpenses = allTx
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({ description: t.description, amount: t.amount, category: t.category, date: t.date.toISOString() }));

  // Daily average spending
  const dates = expenseTx.map(t => t.date.getTime());
  const daySpan = dates.length > 1 ? Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)) : 1;
  const dailyAvgSpending = Math.round(totalExpenses / Math.max(daySpan, 1));

  // Income sources breakdown
  const incomeTx = allTx.filter(t => t.type === 'income');
  const totalIncome = incomeTx.reduce((s, t) => s + t.amount, 0);
  const incomeMap: Record<string, number> = {};
  for (const t of incomeTx) {
    incomeMap[t.category] = (incomeMap[t.category] || 0) + t.amount;
  }
  const incomeSources = Object.entries(incomeMap)
    .map(([source, total]) => ({
      source,
      total,
      percentage: totalIncome > 0 ? Math.round((total / totalIncome) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Spending by day of week
  const dayOfWeekSpending: Record<string, { total: number; count: number }> = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const t of expenseTx) {
    const day = dayNames[t.date.getDay()];
    if (!dayOfWeekSpending[day]) dayOfWeekSpending[day] = { total: 0, count: 0 };
    dayOfWeekSpending[day].total += t.amount;
    dayOfWeekSpending[day].count += 1;
  }
  const weekdaySpending = dayNames.map(day => ({
    day,
    total: dayOfWeekSpending[day]?.total ?? 0,
    count: dayOfWeekSpending[day]?.count ?? 0,
    avg: dayOfWeekSpending[day] ? Math.round(dayOfWeekSpending[day].total / dayOfWeekSpending[day].count) : 0,
  }));

  return Response.json({
    empty: false,
    summary: {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      transactionCount: allTx.length,
      dailyAvgSpending,
      incomeExpenseRatio: totalExpenses > 0 ? Math.round((totalIncome / totalExpenses) * 100) / 100 : 0,
    },
    monthlyBreakdown,
    categoryBreakdown,
    categoryTrends,
    topExpenses,
    incomeSources,
    weekdaySpending,
  });
}
