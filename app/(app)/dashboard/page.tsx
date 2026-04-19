'use client';

import SummaryCards from '@/components/dashboard/SummaryCards';
import BalanceTrendChart from '@/components/dashboard/BalanceTrendChart';
import SpendingBreakdownChart from '@/components/dashboard/SpendingBreakdownChart';
import { useInitTransactions } from '@/lib/useInitTransactions';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { loading } = useInitTransactions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <p className="text-xs text-zinc-400">Your financial overview at a glance.</p>
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
