'use client';

import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionTable from '@/components/transactions/TransactionTable';
import { useInitTransactions } from '@/lib/useInitTransactions';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const { loading } = useInitTransactions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <p className="text-xs text-zinc-400">Browse, filter, and manage your transactions.</p>
      <TransactionFilters />
      <TransactionTable />
    </div>
  );
}
