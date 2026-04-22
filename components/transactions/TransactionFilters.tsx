'use client';

import { useFinanceStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { Category } from '@/types';

const CATEGORIES: Category[] = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
];

export default function TransactionFilters() {
  const { filters, setFilter } = useFinanceStore();

  const hasActiveFilters =
    filters.search !== '' || filters.category !== 'all' || filters.type !== 'all';

  function resetFilters() {
    setFilter('search', '');
    setFilter('category', 'all');
    setFilter('type', 'all');
    setFilter('sortBy', 'date');
    setFilter('sortOrder', 'desc');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <Input
          placeholder="Search transactions..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9 h-8 text-sm border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-violet-500/50 dark:focus-visible:ring-violet-500/40 backdrop-blur-sm"
        />
      </div>

      <Select value={filters.category} onValueChange={(v) => setFilter('category', v ?? 'all')}>
        <SelectTrigger className="w-38 h-8 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:text-white/80 backdrop-blur-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => setFilter('type', v ?? 'all')}>
        <SelectTrigger className="w-32 h-8 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:text-white/80 backdrop-blur-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Types</SelectItem>
          <SelectItem value="income" className="text-xs">Income</SelectItem>
          <SelectItem value="expense" className="text-xs">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sortBy} onValueChange={(v) => setFilter('sortBy', v ?? 'date')}>
        <SelectTrigger className="w-28 h-8 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:text-white/80 backdrop-blur-sm">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date" className="text-xs">Date</SelectItem>
          <SelectItem value="amount" className="text-xs">Amount</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white font-normal backdrop-blur-sm"
        onClick={() => setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <ArrowUpDown className="w-3 h-3" />
        {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-normal px-2"
          onClick={resetFilters}
        >
          <X className="w-3 h-3" />
          Reset
        </Button>
      )}
    </div>
  );
}
