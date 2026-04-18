'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, TransactionType } from '@/types';
import { toast } from 'sonner';

const CATEGORIES: Category[] = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  description: string;
  amount: string;
  category: Category | '';
  type: TransactionType | '';
  date: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  type?: string;
  date?: string;
}

export default function AddTransactionDialog({ open, onClose }: Props) {
  const { addTransaction } = useFinanceStore();
  const [form, setForm] = useState<FormData>({
    description: '',
    amount: '',
    category: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.category) e.category = 'Required';
    if (!form.type) e.type = 'Required';
    if (!form.date) e.date = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await addTransaction({
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category as Category,
      type: form.type as TransactionType,
      date: new Date(form.date).toISOString(),
    });
    toast.success('Transaction added');
    handleClose();
  }

  function handleClose() {
    setForm({ description: '', amount: '', category: '', type: '', date: new Date().toISOString().split('T')[0] });
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold dark:text-zinc-100">Add Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
            <Input
              placeholder="e.g. Grocery run"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.description && <p className="text-[11px] text-rose-500">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Amount ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              min={0.01}
              step={0.01}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Category</label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as Category })}>
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
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as TransactionType })}>
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-8 text-sm border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {errors.date && <p className="text-[11px] text-rose-500">{errors.date}</p>}
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
