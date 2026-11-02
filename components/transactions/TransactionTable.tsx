'use client';

import { useMemo, useState } from 'react';
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
import { Pencil, Trash2, ChevronLeft, ChevronRight, FileX, Plus, Download, AlertTriangle, FileUp, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toWholeRupees } from '@/lib/money';
import { applyFilters } from '@/lib/filters';
import { transactionsToCSV } from '@/lib/statement-import';
import { selectedInView, toggleOne, togglePage } from '@/lib/selection';
import { toast } from 'sonner';
import AddTransactionDialog from './AddTransactionDialog';
import ImportCSVDialog from './ImportCSVDialog';
import { CATEGORIES } from '@/lib/categories';

const PAGE_SIZE = 10;

const CATEGORY_DOT: Record<string, string> = {
  Salary: 'bg-zinc-500',
  Freelance: 'bg-teal-500',
  Food: 'bg-amber-500',
  Transport: 'bg-sky-500',
  Entertainment: 'bg-zinc-500',
  Shopping: 'bg-pink-500',
  Healthcare: 'bg-rose-500',
  Utilities: 'bg-orange-500',
  Rent: 'bg-zinc-500',
  Other: 'bg-zinc-400',
};

export default function TransactionTable() {
  const { transactions, filters, role, deleteTransaction, updateTransaction, bulkDeleteTransactions } = useFinanceStore();
  const visible = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
  const isAdmin = role === 'admin';

  // The page lives in the store so changing a filter can send it back to page 1
  const page = useFinanceStore((s) => s.page);
  const setPage = useFinanceStore((s) => s.setPage);
  const [addOpen, setAddOpen] = useState(false);
  // A new key each time the dialog opens gives it a fresh form, with today's date
  const [addKey, setAddKey] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Runs one save or delete at a time and reports a failure instead of a fake success
  async function run(action: () => Promise<void>, failure: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failure);
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = visible.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

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
    const amount = toWholeRupees(editForm.amount ?? '');
    if (amount === null) {
      toast.error('Enter an amount of at least ₹1');
      return;
    }
    await run(async () => {
      await updateTransaction(editTx.id, {
        ...editForm,
        amount,
        date: editForm.date ? new Date(editForm.date).toISOString() : editTx.date,
      });
      setEditTx(null);
      toast.success(
        amount === editForm.amount
          ? 'Transaction updated'
          : `Transaction updated to ₹${amount.toLocaleString('en-IN')} (Kharcha stores whole rupees)`
      );
    }, 'Could not update the transaction');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await run(async () => {
      await deleteTransaction(deleteTarget.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success('Transaction deleted');
      setDeleteTarget(null);
    }, 'Could not delete the transaction');
  }

  function toggleSelect(id: string) {
    setSelected((prev) => toggleOne(prev, id));
  }

  function toggleSelectAll() {
    setSelected((prev) => togglePage(prev, paged.map((tx) => tx.id)));
  }

  async function confirmBulkDelete() {
    const count = selectedIds.length;
    await run(async () => {
      await bulkDeleteTransactions(selectedIds);
      toast.success(`${count} transaction${count !== 1 ? 's' : ''} deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
    }, 'Could not delete the transactions');
  }

  function exportCSV() {
    // The byte-order mark makes Excel read the file as UTF-8 (₹, – and other non-ASCII text)
    const blob = new Blob(['\uFEFF' + transactionsToCSV(visible)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kharcha-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${visible.length} transaction${visible.length !== 1 ? 's' : ''}`);
  }

  // Rows ticked and then hidden by the search or filters are not counted or deleted
  const selectedIds = selectedInView(visible, selected);
  const allPageSelected = paged.length > 0 && paged.every((tx) => selected.has(tx.id));
  const somePageSelected = paged.some((tx) => selected.has(tx.id));

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900 dark:glass dark:border-white/[0.12] text-white dark:text-white">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-zinc-400 dark:text-white/40 hover:text-white dark:hover:text-white hover:bg-zinc-800 dark:hover:bg-white/10"
              onClick={() => setSelected(new Set())}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-rose-500 hover:bg-rose-600 text-white border-0"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete {selectedIds.length}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white font-normal backdrop-blur-sm"
          onClick={exportCSV}
          disabled={visible.length === 0}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white font-normal backdrop-blur-sm"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-medium rounded-lg px-3"
              onClick={() => {
                setAddKey((k) => k + 1);
                setAddOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </Button>
          </>
        )}
      </div>

      <div className="bg-white dark:glass rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 dark:border-white/[0.05] hover:bg-transparent">
                {isAdmin && (
                  <TableHead className="h-10 w-10 pl-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                    />
                  </TableHead>
                )}
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-white/30 uppercase tracking-widest h-10 w-28">Date</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-white/30 uppercase tracking-widest h-10">Description</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-white/30 uppercase tracking-widest h-10 w-36">Category</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-white/30 uppercase tracking-widest h-10 w-24">Type</TableHead>
                <TableHead className="text-[11px] font-medium text-zinc-400 dark:text-white/30 uppercase tracking-widest h-10 w-28 text-right">Amount</TableHead>
                {isAdmin && <TableHead className="h-10 w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-20">
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
                    className={cn(
                      'border-zinc-100 dark:border-white/[0.05] hover:bg-zinc-50/60 dark:hover:bg-white/[0.03] transition-colors',
                      selected.has(tx.id) && 'bg-zinc-50 dark:bg-white/[0.04]'
                    )}
                  >
                    {isAdmin && (
                      <TableCell className="pl-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(tx.id)}
                          onChange={() => toggleSelect(tx.id)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-zinc-400 dark:text-white/35 tabular-nums py-3.5">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-zinc-800 dark:text-white/85 max-w-xs truncate py-3.5">
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
                        tx.type === 'income' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                      )}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      'text-sm font-semibold text-right tabular-nums py-3.5',
                      tx.type === 'income' ? 'text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-zinc-100'
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

      {visible.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-white/30">
            {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, visible.length)} of {visible.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] text-zinc-500 dark:text-white/50 dark:hover:text-white bg-white"
              disabled={safeCurrentPage <= 1}
              onClick={() => setPage(safeCurrentPage - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-zinc-500 dark:text-white/40 px-2 tabular-nums">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] text-zinc-500 dark:text-white/50 dark:hover:text-white bg-white"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setPage(safeCurrentPage + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <AddTransactionDialog key={addKey} open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Import dialog */}
      <ImportCSVDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Edit dialog */}
      <Dialog open={!!editTx} onOpenChange={(v) => !v && setEditTx(null)}>
        <DialogContent className="sm:max-w-sm dark:bg-[#0f0f14] dark:border-white/[0.08] dark:backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold dark:text-white">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-white/50">Description</label>
              <Input
                value={editForm.description ?? ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="h-8 text-sm border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-white/50">Amount (₹)</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={editForm.amount ?? ''}
                onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                className="h-8 text-sm border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-white/50">Category</label>
                <Select value={editForm.category} onValueChange={(v) => v && setEditForm({ ...editForm, category: v as Category })}>
                  <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85">
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
                <label className="text-xs font-medium text-zinc-600 dark:text-white/50">Type</label>
                <Select value={editForm.type} onValueChange={(v) => v && setEditForm({ ...editForm, type: v as TransactionType })}>
                  <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85">
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
              <label className="text-xs font-medium text-zinc-600 dark:text-white/50">Date</label>
              <Input
                type="date"
                value={typeof editForm.date === 'string' ? editForm.date.split('T')[0] : ''}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="h-8 text-sm border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => setEditTx(null)} className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85">
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={busy} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white">
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(v) => !v && setBulkDeleteOpen(false)}>
        <DialogContent className="sm:max-w-sm dark:bg-[#0f0f14] dark:border-white/[0.08] dark:backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-500/10 dark:border dark:border-rose-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <DialogTitle className="text-sm font-semibold dark:text-white">Delete {selectedIds.length} Transactions</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-12">
              This will permanently delete {selectedIds.length} transaction{selectedIds.length !== 1 ? 's' : ''}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)} className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85">
              Cancel
            </Button>
            <Button size="sm" onClick={confirmBulkDelete} disabled={busy} className="h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white">
              {busy ? 'Deleting…' : `Delete ${selectedIds.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm dark:bg-[#0f0f14] dark:border-white/[0.08] dark:backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-500/10 dark:border dark:border-rose-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <DialogTitle className="text-sm font-semibold dark:text-white">Delete Transaction</DialogTitle>
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
              className="h-8 text-xs border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/85"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmDelete}
              disabled={busy}
              className="h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
