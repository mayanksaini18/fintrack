'use client';

import BudgetList from '@/components/budgets/BudgetList';

export default function BudgetsPage() {
  return (
    <div className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Budget Goals</h1>
        <p className="text-xs text-zinc-400 dark:text-white/35 mt-0.5">
          Set monthly spending limits per category and track your progress
        </p>
      </div>
      <BudgetList />
    </div>
  );
}
