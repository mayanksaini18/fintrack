'use client';

import RecurringList from '@/components/recurring/RecurringList';

export default function RecurringPage() {
  return (
    <div className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Recurring</h1>
        <p className="text-xs text-zinc-400 dark:text-white/35 mt-0.5">
          Manage subscriptions, rent, salary, and other repeating transactions
        </p>
      </div>
      <RecurringList />
    </div>
  );
}
