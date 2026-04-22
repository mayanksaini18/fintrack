'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pause, Play, RefreshCw, CalendarClock } from 'lucide-react';
import { Category, TransactionType, Frequency, RecurringTransaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES: Category[] = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
];

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const CATEGORY_COLORS: Record<string, string> = {
  Salary: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Freelance: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  Transport: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  Entertainment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  Shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  Healthcare: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  Utilities: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Rent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  Other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function RecurringList() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/recurring');
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete(id: string) {
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Recurring item deleted');
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/recurring/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isActive: !isActive } : i))
    );
    toast.success(isActive ? 'Paused' : 'Resumed');
  }

  async function handleProcess() {
    setProcessing(true);
    const res = await fetch('/api/recurring/process', { method: 'POST' });
    const data = await res.json();
    if (data.created > 0) {
      toast.success(`Created ${data.created} transaction${data.created > 1 ? 's' : ''} from recurring items`);
      fetchItems();
    } else {
      toast.info('No recurring items are due yet');
    }
    setProcessing(false);
  }

  function formatNextDue(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (diff < 0) return { text: `Overdue (${formatted})`, overdue: true };
    if (diff === 0) return { text: `Due today`, overdue: true };
    if (diff <= 3) return { text: `In ${diff}d (${formatted})`, overdue: false };
    return { text: formatted, overdue: false };
  }

  const totalMonthly = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => {
      const mult = i.frequency === 'weekly' ? 4.33 : i.frequency === 'yearly' ? 1 / 12 : 1;
      const val = i.amount * mult;
      return sum + (i.type === 'expense' ? -val : val);
    }, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] dark:backdrop-blur-sm text-sm border dark:border-white/[0.08]">
            <CalendarClock className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Monthly net:</span>
            <span className={`font-semibold ${totalMonthly >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totalMonthly >= 0 ? '+' : ''}{formatCurrency(Math.round(totalMonthly))}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {items.filter((i) => i.isActive).length} active
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcess}
            disabled={processing}
            className="h-8 text-xs gap-1.5 border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:hover:text-white backdrop-blur-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
            Process Due
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="h-8 text-xs gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white dark:shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recurring
          </Button>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <CalendarClock className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No recurring transactions yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Add your rent, subscriptions, or salary to auto-track them</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const due = formatNextDue(item.nextDueDate);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition-colors ${
                  item.isActive
                    ? 'bg-white dark:bg-white/[0.04] dark:backdrop-blur-sm border-zinc-200/80 dark:border-white/[0.08] dark:hover:border-white/[0.14]'
                    : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/40 dark:border-white/[0.04] opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white/90 truncate">
                        {item.description}
                      </p>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${CATEGORY_COLORS[item.category] || ''}`}>
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {FREQUENCY_LABELS[item.frequency]}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className={`text-xs ${due.overdue ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {due.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-semibold tabular-nums ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      onClick={() => handleToggle(item.id, item.isActive)}
                    >
                      {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddRecurringDialog open={showAdd} onClose={() => setShowAdd(false)} onAdded={fetchItems} />
    </div>
  );
}

function AddRecurringDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: '' as Category | '',
    type: '' as TransactionType | '',
    frequency: '' as Frequency | '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.category) e.category = 'Required';
    if (!form.type) e.type = 'Required';
    if (!form.frequency) e.frequency = 'Required';
    if (!form.startDate) e.startDate = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.description.trim(),
        amount: Number(form.amount),
        category: form.category,
        type: form.type,
        frequency: form.frequency,
        startDate: new Date(form.startDate).toISOString(),
      }),
    });
    toast.success('Recurring transaction added');
    onAdded();
    handleClose();
  }

  function handleClose() {
    setForm({ description: '', amount: '', category: '', type: '', frequency: '', startDate: new Date().toISOString().split('T')[0] });
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Add Recurring Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
            <Input
              placeholder="e.g. Netflix subscription"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.description && <p className="text-[11px] text-rose-500">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount (₹)</label>
            <Input
              type="number"
              placeholder="0"
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-[11px] text-rose-500">{errors.category}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income" className="text-xs">Income</SelectItem>
                  <SelectItem value="expense" className="text-xs">Expense</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-[11px] text-rose-500">{errors.type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Frequency</label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}>
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                  <SelectItem value="yearly" className="text-xs">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-[11px] text-rose-500">{errors.frequency}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Start Date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              {errors.startDate && <p className="text-[11px] text-rose-500">{errors.startDate}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-1">
          <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
