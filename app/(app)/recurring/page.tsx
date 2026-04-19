'use client';

import RecurringList from '@/components/recurring/RecurringList';

export default function RecurringPage() {
  return (
    <div className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recurring Transactions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage subscriptions, rent, salary, and other repeating transactions
        </p>
      </div>
      <RecurringList />
    </div>
  );
}
