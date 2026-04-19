'use client';

import BudgetList from '@/components/budgets/BudgetList';

export default function BudgetsPage() {
  return (
    <div className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Budget Goals</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Set monthly spending limits per category and track your progress
        </p>
      </div>
      <BudgetList />
    </div>
  );
}
