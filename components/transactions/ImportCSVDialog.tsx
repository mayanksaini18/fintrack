'use client';

import { useState, useRef } from 'react';
import { useFinanceStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPaytmFormat, parseGeneric, parsePaytm, type ParsedRow } from '@/lib/statement-import';

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; }

export default function ImportCSVDialog({ open, onClose }: Props) {
  const { importTransactions } = useFinanceStore();
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const paytm = isPaytmFormat(text);
      setDetectedFormat(paytm ? 'Paytm UPI Statement' : 'Generic bank CSV');
      const { rows, errors } = paytm ? parsePaytm(text) : parseGeneric(text);
      setParsed(rows);
      setParseErrors(errors);
      setStep('preview');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importing) return;
    setImporting(true);
    try {
      await importTransactions(parsed);
      toast.success(`Imported ${parsed.length} transactions from ${detectedFormat}`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setStep('upload');
    setParsed([]);
    setParseErrors([]);
    setFileName('');
    onClose();
  }

  const incomeCount = parsed.filter((r) => r.type === 'income').length;
  const expenseCount = parsed.filter((r) => r.type === 'expense').length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl dark:bg-[#0f0f14] dark:border-white/[0.08] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold dark:text-zinc-100">
            Import Bank Statement
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Supports Paytm UPI statements and CSV exports from HDFC, SBI, ICICI, Axis.
            Self-transfers and page headers are automatically skipped.
          </DialogDescription>
        </DialogHeader>

        {/* Upload step */}
        {step === 'upload' && (
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
              dragging
                ? 'border-zinc-400 bg-zinc-50 dark:bg-white/[0.06]'
                : 'border-zinc-200 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-white/20'
            )}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/[0.06] dark:border dark:border-white/[0.08] flex items-center justify-center">
              <Upload className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop your CSV here, or click to browse
              </p>
              <p className="text-xs text-zinc-400 mt-1.5">
                <span className="font-medium text-zinc-500">Paytm:</span> App → Profile → Passbook → ⋮ → Download Statement
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                <span className="font-medium text-zinc-500">Banks:</span> Net Banking → Account Statement → Download CSV
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && (
          <div className="flex flex-col gap-3 min-h-0">
            {/* File info bar */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08]">
              <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{fileName}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Detected: {detectedFormat}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] font-medium">
                <span className="text-zinc-700 dark:text-zinc-300">+{incomeCount} income</span>
                <span className="text-zinc-500">{expenseCount} expenses</span>
                <span className="text-zinc-400">{parsed.length} total</span>
              </div>
            </div>

            {/* Warnings */}
            {parseErrors.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{parseErrors.length} rows skipped</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {parseErrors.slice(0, 3).map((e, i) => (
                      <li key={i} className="text-[11px] text-amber-600 dark:text-amber-500">{e}</li>
                    ))}
                    {parseErrors.length > 3 && <li className="text-[11px] text-amber-500">+{parseErrors.length - 3} more</li>}
                  </ul>
                </div>
              </div>
            )}

            {parsed.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
                <AlertTriangle className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium text-zinc-500">No transactions could be parsed</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setStep('upload')}>
                  Try another file
                </Button>
              </div>
            ) : (
              <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-white/[0.08] flex-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.03]">
                      {['Date', 'Description', 'Category', 'Amount'].map((h) => (
                        <th key={h} className={cn(
                          'px-3 py-2 text-[11px] font-medium text-zinc-400 uppercase tracking-wider',
                          h === 'Amount' ? 'text-right' : 'text-left'
                        )}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 12).map((row, i) => (
                      <tr key={i} className="border-b border-zinc-100 dark:border-white/[0.05] last:border-0 hover:bg-zinc-50/60 dark:hover:bg-white/[0.03]">
                        <td className="px-3 py-2 text-zinc-500 tabular-nums whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 max-w-[220px] truncate">{row.description}</td>
                        <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{row.category}</td>
                        <td className={cn(
                          'px-3 py-2 text-right font-medium tabular-nums',
                          row.type === 'income' ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-800 dark:text-zinc-200'
                        )}>
                          {row.type === 'income' ? '+' : '−'}₹{row.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 12 && (
                  <p className="text-center text-[11px] text-zinc-400 py-2 border-t border-zinc-100 dark:border-zinc-800">
                    Showing 12 of {parsed.length} — all will be imported
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 mt-2 shrink-0">
          {step === 'preview' && parsed.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 mr-auto"
              onClick={() => setStep('upload')}>
              ← Different file
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}
            className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
            Cancel
          </Button>
          {step === 'preview' && parsed.length > 0 && (
            <Button size="sm" onClick={handleImport} disabled={importing}
              className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {importing ? 'Importing…' : `Import ${parsed.length} transactions`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
