'use client';

import { useState } from 'react';
import { PlusCircle, Upload, Sparkles } from 'lucide-react';
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog';
import SmartImportDialog from '@/components/transactions/SmartImportDialog';

export default function EmptyState() {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Welcome to Kharcha!</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">
          Start by adding your first transaction or import a bank statement to see your finances come to life.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add transaction
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import bank statement
        </button>
      </div>

      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />
      <SmartImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
