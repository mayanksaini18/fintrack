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
import { Category, TransactionType } from '@/types';

// ─── CSV line parser ──────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; continue; }
    if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += line[i];
  }
  result.push(current.trim());
  return result;
}

// ─── Category rules ───────────────────────────────────────────────────────────
function mapCategory(paytmTag: string, description: string): Category {
  const tag = paytmTag.toLowerCase();
  const desc = description.toLowerCase();

  if (tag.includes('food') || tag.includes('groceries')) return 'Food';
  if (tag.includes('shopping')) return 'Shopping';

  if (tag.includes('bill')) {
    if (
      desc.includes('jio') || desc.includes('airtel') || desc.includes('vi ') ||
      desc.includes('bsnl') || desc.includes('recharge') || desc.includes('electricity') ||
      desc.includes('bescom') || desc.includes('tata power') || desc.includes('wifi') ||
      desc.includes('broadband') || desc.includes('internet')
    ) return 'Utilities';
    return 'Other'; // credit card bills, etc.
  }

  if (tag.includes('investment')) return 'Other';

  // Description fallbacks
  if (desc.includes('salary') || desc.includes('payroll')) return 'Salary';
  if (desc.includes('rent')) return 'Rent';
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('rapido') ||
      desc.includes('petrol') || desc.includes('metro') || desc.includes('irctc') ||
      desc.includes('flight') || desc.includes('fastag')) return 'Transport';
  if (desc.includes('apollo') || desc.includes('hospital') || desc.includes('pharmacy') ||
      desc.includes('medical') || desc.includes('doctor')) return 'Healthcare';
  if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('dominos') ||
      desc.includes('cafe') || desc.includes('restaurant') || desc.includes('tiffins') ||
      desc.includes('food')) return 'Food';
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') ||
      desc.includes('ajio') || desc.includes('nykaa')) return 'Shopping';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime') ||
      desc.includes('hotstar') || desc.includes('pvr') || desc.includes('bookmyshow')) return 'Entertainment';

  return 'Other';
}

// ─── Shared types ─────────────────────────────────────────────────────────────
interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
}

// ─── Paytm-specific parser ────────────────────────────────────────────────────
// Paytm CSV format: each transaction spans 3-5 rows.
// Row 0: "DD Mon" | Description | Tag: | Bank | "± Rs.Amount"
// Row 1: "H:MM AM/PM" | (name cont.) | (note cont.) | (bank cont.) | -
// Row 2: "" | "UPI ID: ..." | "# Category" | "Bank-XXXX" | -
// Row 3: "" | "UPI Ref No: ..." | ... | - | -
// Row 4 (sometimes): "" | "Order ID: ..." | - | - | -
// Self-transfers have no ± sign and are followed by "Note: This payment is not included..."

const MONTH_MAP: Record<string, string> = {
  Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
  Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12',
};
// Oct–Dec are 2025 for this statement, Jan–Apr are 2026
const MONTH_YEAR: Record<string, number> = {
  Jan:2026, Feb:2026, Mar:2026, Apr:2026, May:2026, Jun:2026,
  Jul:2026, Aug:2026, Sep:2026, Oct:2025, Nov:2025, Dec:2025,
};
const DATE_RE = /^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;

const SKIP_RE = [
  /^Page\d+of\d+/i,
  /^Passbook Payments/i,
  /^All payments done/i,
  /^Date &/i,
  /^,Transaction Details/i,
  /^Time,/i,
  /^Note: This payment is not included/i,
  /^For any queries/i,
  /^Contact Us/i,
  /^Paytm Statement/i,
  /^Accounts,/i,
  /^Gold Coins/i,
  /^Tamilnad Mercantile/i,
  /^Kotak Mahindra/i,
  /^\d+ Payments/i,
];

function parsePaytm(csvText: string): { rows: ParsedRow[]; errors: string[] } {
  const rawLines = csvText.split('\n');
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  // Group raw lines into transaction blocks
  // A block starts when col[0] matches DD Mon pattern
  const blocks: string[][][] = []; // array of blocks, each block = array of parsed CSV rows
  let currentBlock: string[][] | null = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Skip known boilerplate lines
    if (SKIP_RE.some((r) => r.test(trimmed))) {
      // A page break ends the current block too
      if (currentBlock && currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    const cols = parseCSVLine(trimmed);
    const col0 = cols[0]?.trim() ?? '';

    if (DATE_RE.test(col0)) {
      // Save previous block, start new one
      if (currentBlock && currentBlock.length > 0) blocks.push(currentBlock);
      currentBlock = [cols];
    } else if (currentBlock) {
      currentBlock.push(cols);
    }
  }
  if (currentBlock && currentBlock.length > 0) blocks.push(currentBlock);

  // Parse each block
  for (const block of blocks) {
    const firstRow = block[0];
    const dateStr = firstRow[0]?.trim() ?? '';
    const description = firstRow[1]?.trim() ?? '';
    const amountStr = firstRow[4]?.trim() ?? '';

    // Skip self transfers (no ± prefix)
    if (!amountStr.startsWith('+') && !amountStr.startsWith('-')) continue;
    if (description.toLowerCase().includes('transferred to self')) continue;
    if (block.some((r) => r.join(',').toLowerCase().includes('# self transfer'))) continue;

    // Parse date
    const dm = dateStr.match(DATE_RE);
    if (!dm) continue;
    const day = dm[1].padStart(2, '0');
    const monStr = dm[2];
    const year = MONTH_YEAR[monStr] ?? 2026;
    const isoDate = `${year}-${MONTH_MAP[monStr]}-${day}T00:00:00.000Z`;

    // Parse amount
    const isIncome = amountStr.startsWith('+');
    const cleanAmt = amountStr.replace(/[+\-Rs.,\s]/g, '');
    const amount = parseFloat(cleanAmt);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Skipped: "${description}" — invalid amount "${amountStr}"`);
      continue;
    }

    // Extract Paytm tag from all rows' col[2]
    let paytmTag = '';
    for (const r of block) {
      const col2 = r[2]?.trim() ?? '';
      if (col2.startsWith('#')) { paytmTag = col2; break; }
    }

    const type: TransactionType = isIncome ? 'income' : 'expense';
    const category = mapCategory(paytmTag, description);

    rows.push({ date: isoDate, description, amount: Math.round(amount), type, category });
  }

  return { rows, errors };
}

// ─── Generic CSV parser (fallback for non-Paytm) ──────────────────────────────
function parseGeneric(csvText: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = csvText.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['File is empty'] };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const descIdx = headers.findIndex((h) =>
    h.includes('narration') || h.includes('particular') || h.includes('description') || h.includes('details')
  );
  const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('withdrawal'));
  const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('deposit'));
  const amountIdx = headers.findIndex((h) => h === 'amount' || h === 'amt');

  if (dateIdx === -1 || descIdx === -1 || (debitIdx === -1 && creditIdx === -1 && amountIdx === -1)) {
    return { rows: [], errors: ['Could not detect columns. Expected Date, Description, and Debit/Credit or Amount columns.'] };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const rawDate = cols[dateIdx]?.trim() ?? '';
    const description = cols[descIdx]?.trim() ?? `Transaction ${i}`;

    // Try to parse date
    let isoDate: string | null = null;
    const m1 = rawDate.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (m1) isoDate = `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T00:00:00.000Z`;
    const m2 = rawDate.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
    if (m2) isoDate = new Date(rawDate).toISOString();
    if (!isoDate) { errors.push(`Row ${i + 1}: bad date "${rawDate}" — skipped`); continue; }

    let amount = 0;
    let type: TransactionType = 'expense';
    if (amountIdx !== -1) {
      amount = parseFloat((cols[amountIdx] ?? '').replace(/[₹,\s]/g, ''));
      type = mapCategory('', description) === 'Salary' || mapCategory('', description) === 'Freelance' ? 'income' : 'expense';
    } else {
      const debit = parseFloat((cols[debitIdx] ?? '').replace(/[₹,\s]/g, '')) || 0;
      const credit = parseFloat((cols[creditIdx] ?? '').replace(/[₹,\s]/g, '')) || 0;
      if (credit > 0) { amount = credit; type = 'income'; }
      else if (debit > 0) { amount = debit; type = 'expense'; }
      else continue;
    }
    if (isNaN(amount) || amount <= 0) { errors.push(`Row ${i + 1}: bad amount — skipped`); continue; }

    rows.push({ date: isoDate, description, amount: Math.round(amount), type, category: mapCategory('', description) });
  }
  return { rows, errors };
}

function isPaytmFormat(csvText: string): boolean {
  const top = csvText.slice(0, 400).toLowerCase();
  return top.includes('passbook payments history') || top.includes('paytm statement') || top.includes('total money paid');
}

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
    await importTransactions(parsed);
    toast.success(`Imported ${parsed.length} transactions from ${detectedFormat}`);
    handleClose();
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
                ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/5'
                : 'border-zinc-200 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-violet-500/30'
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
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-violet-500/10 dark:border dark:border-violet-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-400" />
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
                <span className="text-violet-600 dark:text-violet-400">+{incomeCount} income</span>
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
                          row.type === 'income' ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-800 dark:text-zinc-200'
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
            <Button size="sm" onClick={handleImport}
              className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Import {parsed.length} transactions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
