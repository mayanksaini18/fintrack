'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/lib/store';
import { Transaction, Category, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, ChevronLeft, ChevronRight, FileX, Plus, Download, AlertTriangle, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AddTransactionDialog from './AddTransactionDialog';
import ImportCSVDialog from './ImportCSVDialog';

const CATEGORIES: Category[] = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
];

const PAGE_SIZE = 10;

const CATEGORY_DOT: Record<string, string> = {
  Salary: 'bg-emerald-500',
  Freelance: 'bg-teal-500',
  Food: 'bg-amber-500',
  Transport: 'bg-sky-500',
  Entertainment: 'bg-violet-500',
  Shopping: 'bg-pink-500',
  Healthcare: 'bg-rose-500',
  Utilities: 'bg-orange-500',
  Rent: 'bg-zinc-500',
  Other: 'bg-zinc-400',
};

export default function TransactionTable() {
  const { transactions, role, deleteTransaction, updateTransaction } = useFinanceStore();
  const isAdmin = role === 'admin';

  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = transactions.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  function openEdit(tx: Transaction) {
    setEditTx(tx);
    setEditForm({
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      date: tx.date.split('T')[0],
    });
  }

  async function saveEdit() {
    if (!editTx) return;
    await updateTransaction(editTx.id, {
      ...editForm,
      date: editForm.date ? new Date(editForm.date).toISOString() : editTx.date,
    });
    setEditTx(null);
    toast.success('Transaction updated');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    toast.success('Transaction deleted');
    setDeleteTarget(null);
  }

  function exportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map((tx) => [
      formatDate(tx.date),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.type,
      tx.amount.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kharcha-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`);
  }

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-normal"
          onClick={exportCSV}
          disabled={transactions.length === 0}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-normal"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-medium rounded-lg px-3"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </Button>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 w-28">Date</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10">Description</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 w-36">Category</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 w-24">Type</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 w-28 text-right">Amount</TableHead>
                {isAdmin && <TableHead className="h-10 w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <FileX className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No transactions found</p>
                      <p className="text-xs text-zinc-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <TableCell className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums py-3.5">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-zinc-800 dark:text-zinc-200 max-w-xs truncate py-3.5">
                      {tx.description}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', CATEGORY_DOT[tx.category] ?? 'bg-zinc-400')} />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{tx.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className={cn(
                        'text-[11px] font-medium uppercase tracking-wide',
                        tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-400 dark:text-zinc-500'
                      )}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      'text-sm font-semibold text-right tabular-nums py-3.5',
                      tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'
                    )}>
                      {tx.type === 'income' ? '+' : '−'}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-300 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => openEdit(tx)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => setDeleteTarget(tx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, transactions.length)} of {transactions.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-zinc-200 dark:border-zinc-800 text-zinc-500 bg-white dark:bg-zinc-900"
              disabled={safeCurrentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 tabular-nums">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-zinc-200 dark:border-zinc-800 text-zinc-500 bg-white dark:bg-zinc-900"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Import dialog */}
      <ImportCSVDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Edit dialog */}
      <Dialog open={!!editTx} onOpenChange={(v) => !v && setEditTx(null)}>
        <DialogContent className="sm:max-w-sm dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
              <Input
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount ($)</label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={editForm.amount ?? ''}
                onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
                <Select value={editForm.category} onValueChange={(v) => v && setEditForm({ ...editForm, category: v as Category })}>
                  <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</label>
                <Select value={editForm.type} onValueChange={(v) => v && setEditForm({ ...editForm, type: v as TransactionType })}>
                  <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income" className="text-xs">Income</SelectItem>
                    <SelectItem value="expense" className="text-xs">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</label>
              <Input
                type="date"
                value={typeof editForm.date === 'string' ? editForm.date.split('T')[0] : ''}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => setEditTx(null)} className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Delete Transaction</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-12">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{deleteTarget?.description}</span>
              {' '}will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmDelete}
              className="h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
