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
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center dark:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
        <Sparkles className="w-7 h-7 text-violet-500" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:bg-gradient-to-r dark:from-white dark:via-violet-100 dark:to-violet-300 dark:bg-clip-text dark:text-transparent">
          Welcome to Kharcha!
        </h2>
        <p className="text-sm text-zinc-400 dark:text-white/35 mt-2 max-w-sm">
          Start by adding your first transaction or import a bank statement to see your finances come to life.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-sm font-medium hover:bg-zinc-800 transition-colors dark:shadow-[0_0_20px_rgba(139,92,246,0.35)]"
        >
          <PlusCircle className="w-4 h-4" />
          Add transaction
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.10] dark:bg-white/[0.04] dark:backdrop-blur-sm text-zinc-700 dark:text-white/70 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/[0.08] transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import bank statement
        </button>
      </div>

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <SmartImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
