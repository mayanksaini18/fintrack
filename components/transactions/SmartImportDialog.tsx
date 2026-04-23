'use client';

import { useState, useRef } from 'react';
import { useFinanceStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, Check, X, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types';
import { toast } from 'sonner';

interface ParsedTransaction {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  selected: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED = '.csv,.xlsx,.xls,.pdf,.txt';

export default function SmartImportDialog({ open, onClose }: Props) {
  const { importTransactions } = useFinanceStore();
  const [step, setStep] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setFilename(file.name);
    setStep('parsing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to parse');

      const withSelection = data.transactions.map((t: Omit<ParsedTransaction, 'selected'>) => ({
        ...t,
        selected: true,
      }));
      setParsed(withSelection);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse document');
      setStep('upload');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function toggleItem(index: number) {
    setParsed((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  }

  function toggleAll() {
    const allSelected = parsed.every((t) => t.selected);
    setParsed((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  }

  async function handleImport() {
    const selected = parsed.filter((t) => t.selected);
    if (selected.length === 0) return;

    setImporting(true);
    const txns: Omit<Transaction, 'id'>[] = selected.map((t) => ({
      date: new Date(t.date).toISOString(),
      amount: t.amount,
      type: t.type,
      category: t.category as Transaction['category'],
      description: t.description,
    }));

    try {
      await importTransactions(txns);
      toast.success(`Imported ${selected.length} transactions from ${filename}`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    }
    setImporting(false);
  }

  function handleClose() {
    setStep('upload');
    setParsed([]);
    setFilename('');
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  }

  const selectedCount = parsed.filter((t) => t.selected).length;
  const totalIncome = parsed.filter((t) => t.selected && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = parsed.filter((t) => t.selected && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg dark:bg-[#0f0f14] dark:border-white/[0.08] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            Smart Import
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                dragOver
                  ? 'border-zinc-400 bg-zinc-50 dark:bg-white/[0.06]'
                  : 'border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-50 dark:bg-white/[0.03]'
              }`}
            >
              <Upload className="w-8 h-8 text-zinc-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Supports CSV, Excel (.xlsx/.xls), PDF, and text files
                </p>
              </div>
              <div className="flex gap-1.5 mt-1">
                {['CSV', 'Excel', 'PDF', 'TXT'].map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-white/[0.06] dark:text-white/50 text-zinc-500">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileInput}
              className="hidden"
            />
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mt-3">{error}</p>
            )}
          </div>
        )}

        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                AI is parsing your document...
              </p>
              <p className="text-xs text-zinc-400 mt-1">{filename}</p>
            </div>
          </div>
        )}

        {step === 'review' && (
          <>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500 truncate max-w-[150px]">{filename}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {parsed.length} found
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="h-7 text-xs text-zinc-500">
                {parsed.every((t) => t.selected) ? 'Deselect all' : 'Select all'}
              </Button>
            </div>

            <div className="flex gap-3 text-xs text-zinc-500 px-1">
              <span>Selected: <strong className="text-zinc-700 dark:text-zinc-300">{selectedCount}</strong></span>
              <span>Income: <strong className="text-zinc-700 dark:text-zinc-300">{formatCurrency(totalIncome)}</strong></span>
              <span>Expense: <strong className="text-rose-600">{formatCurrency(totalExpense)}</strong></span>
            </div>

            <div className="overflow-y-auto max-h-[45vh] -mx-6 px-6 space-y-1.5 py-1">
              {parsed.map((t, i) => (
                <div
                  key={i}
                  onClick={() => toggleItem(i)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    t.selected
                      ? 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04]'
                      : 'border-transparent bg-zinc-50 dark:bg-transparent opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    t.selected
                      ? 'border-zinc-700 bg-zinc-700 dark:border-zinc-300 dark:bg-zinc-300'
                      : 'border-zinc-300 dark:border-white/20'
                  }`}>
                    {t.selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{t.description}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{t.category}</Badge>
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.type === 'income' ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white gap-1.5"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Import {selectedCount} transactions
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
