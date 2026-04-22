'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil, Target, AlertTriangle } from 'lucide-react';
import { Category, Budget } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES: Category[] = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
];

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Entertainment: '🎬', Shopping: '🛍️',
  Healthcare: '🏥', Utilities: '💡', Rent: '🏠', Other: '📦',
  Salary: '💰', Freelance: '💻',
};

export default function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const fetchBudgets = useCallback(async () => {
    const res = await fetch('/api/budgets');
    const data: Budget[] = await res.json();
    setBudgets(data);
    setLoading(false);
    const overBudget = data.filter((b) => b.spent > b.monthlyLimit);
    if (overBudget.length > 0) {
      toast.error(
        overBudget.length === 1
          ? `${overBudget[0].category} budget exceeded this month`
          : `${overBudget.length} budgets exceeded this month`,
        { id: 'budget-overspend' }
      );
    }
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  async function handleDelete(id: string) {
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    toast.success('Budget removed');
  }

  async function handleUpdate(id: string) {
    if (!editLimit || Number(editLimit) <= 0) return;
    await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyLimit: Number(editLimit) }),
    });
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, monthlyLimit: Number(editLimit) } : b))
    );
    setEditId(null);
    toast.success('Budget updated');
  }

  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Overall Budget</span>
            <span className={`text-sm font-semibold ${overallPct > 90 ? 'text-rose-600' : overallPct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {overallPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPct > 90 ? 'bg-rose-500' : overallPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>{formatCurrency(totalLimit)} limit</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          className="h-8 text-xs gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Set Budget
        </Button>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No budgets set</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Set monthly limits for categories to track your spending</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {budgets.map((budget) => {
            const pct = budget.monthlyLimit > 0 ? Math.round((budget.spent / budget.monthlyLimit) * 100) : 0;
            const remaining = budget.monthlyLimit - budget.spent;
            const isOver = remaining < 0;
            const isWarning = pct > 70 && pct <= 90;
            const isDanger = pct > 90;

            return (
              <div
                key={budget.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isDanger
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[budget.category] || '📦'}</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{budget.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isDanger && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      onClick={() => { setEditId(budget.id); setEditLimit(String(budget.monthlyLimit)); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                  </span>
                  <span className={`font-medium ${isOver ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isOver ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editId} onOpenChange={(v) => !v && setEditId(null)}>
        <DialogContent className="sm:max-w-xs dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Edit Budget Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Monthly Limit (₹)</label>
            <Input
              type="number"
              value={editLimit}
              onChange={(e) => setEditLimit(e.target.value)}
              min={1}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <DialogFooter className="gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => setEditId(null)} className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              Cancel
            </Button>
            <Button size="sm" onClick={() => editId && handleUpdate(editId)} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddBudgetDialog open={showAdd} onClose={() => setShowAdd(false)} onAdded={fetchBudgets} existing={budgets.map((b) => b.category)} />
    </div>
  );
}

function AddBudgetDialog({ open, onClose, onAdded, existing }: { open: boolean; onClose: () => void; onAdded: () => void; existing: string[] }) {
  const [category, setCategory] = useState<Category | ''>('');
  const [limit, setLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const available = CATEGORIES.filter((c) => !existing.includes(c));

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!category) e.category = 'Required';
    if (!limit || Number(limit) <= 0) e.limit = 'Enter a valid amount';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, monthlyLimit: Number(limit) }),
    });
    toast.success('Budget set');
    onAdded();
    handleClose();
  }

  function handleClose() {
    setCategory('');
    setLimit('');
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-xs dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Set Category Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="_none" disabled className="text-xs">All categories have budgets</SelectItem>
                ) : (
                  available.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {CATEGORY_ICONS[cat]} {cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-[11px] text-rose-500">{errors.category}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Monthly Limit (₹)</label>
            <Input
              type="number"
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min={1}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.limit && <p className="text-[11px] text-rose-500">{errors.limit}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 mt-1">
          <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-xs border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white">
            Set Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
