'use client';

import SummaryCards from '@/components/dashboard/SummaryCards';
import BalanceTrendChart from '@/components/dashboard/BalanceTrendChart';
import SpendingBreakdownChart from '@/components/dashboard/SpendingBreakdownChart';
import EmptyState from '@/components/dashboard/EmptyState';
import { useInitTransactions } from '@/lib/useInitTransactions';
import { useFinanceStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { Loader2, Info } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { loading } = useInitTransactions();
  const { isSignedIn } = useUser();
  const transactions = useFinanceStore((s) => s.transactions);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!loading && isSignedIn && transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {!isSignedIn && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/[0.07] border border-amber-200/60 dark:border-amber-500/20 dark:backdrop-blur-sm">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You&apos;re viewing demo data.{' '}
            <Link href="/sign-up" className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200">
              Sign up
            </Link>{' '}
            to start tracking your own expenses.
          </p>
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:bg-gradient-to-r dark:from-white dark:via-violet-100 dark:to-violet-300 dark:bg-clip-text dark:text-transparent">
          Overview
        </h1>
        <p className="text-xs text-zinc-400 dark:text-white/35 mt-0.5">Your financial snapshot at a glance.</p>
      </div>
      <SummaryCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2">
          <BalanceTrendChart />
        </div>
        <div className="xl:col-span-1">
          <SpendingBreakdownChart />
        </div>
      </div>
    </div>
  );
}
