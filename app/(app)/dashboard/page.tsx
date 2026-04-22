'use client';

import SummaryCards from '@/components/dashboard/SummaryCards';
import BalanceTrendChart from '@/components/dashboard/BalanceTrendChart';
import SpendingBreakdownChart from '@/components/dashboard/SpendingBreakdownChart';
import { useInitTransactions } from '@/lib/useInitTransactions';
import { useUser } from '@clerk/nextjs';
import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { loading } = useInitTransactions();
  const { isSignedIn, user } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Demo banner */}
      {!isSignedIn && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            You&apos;re viewing demo data.{' '}
            <Link href="/sign-up" className="font-semibold underline underline-offset-2 hover:text-indigo-900 dark:hover:text-indigo-200">
              Sign up free
            </Link>{' '}
            to track your own finances.
          </p>
        </div>
      )}

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {isSignedIn && user?.firstName ? `Hey, ${user.firstName} 👋` : 'Financial Overview'}
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Here&apos;s what&apos;s happening with your money.
        </p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
