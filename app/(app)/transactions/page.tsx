'use client';

import { useState } from 'react';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionTable from '@/components/transactions/TransactionTable';
import SmartImportDialog from '@/components/transactions/SmartImportDialog';
import { useInitTransactions } from '@/lib/useInitTransactions';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export default function TransactionsPage() {
  const { loading } = useInitTransactions();
  const [showSmartImport, setShowSmartImport] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:bg-gradient-to-r dark:from-white dark:via-violet-100 dark:to-violet-300 dark:bg-clip-text dark:text-transparent">Transactions</h1>
          <p className="text-xs text-zinc-400 dark:text-white/35 mt-0.5">Browse, filter, and manage your transactions.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSmartImport(true)}
          className="h-8 text-xs gap-1.5 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Smart Import
        </Button>
      </div>
      <TransactionFilters />
      <TransactionTable />
      <SmartImportDialog open={showSmartImport} onClose={() => setShowSmartImport(false)} />
    </div>
  );
}
