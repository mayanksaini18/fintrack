'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ImportResult } from '@/lib/statement-import';
import { Transaction, Role, Filters, Category, TransactionType } from '@/types';

interface FinanceStore {
  // Always the full list: the dashboard totals it, the Transactions page filters it with applyFilters()
  transactions: Transaction[];
  role: Role;
  filters: Filters;
  loading: boolean;
  // True once the first load has finished, so later reloads don't blank the page
  loaded: boolean;
  setRole: (role: Role) => void;
  setFilter: (key: keyof Filters, value: string) => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  importTransactions: (txns: Omit<Transaction, 'id'>[]) => Promise<ImportResult>;
}

const defaultFilters: Filters = {
  search: '',
  category: 'all',
  type: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

// Each load gets a number so a slow, older reply can't overwrite a newer one
let latestLoad = 0;

export const useFinanceStore = create<FinanceStore>()((set, get) => ({
  transactions: [],
  role: 'admin',
  filters: defaultFilters,
  loading: true,
  loaded: false,

  setRole: (role: Role) => set({ role }),

  setFilter: (key: keyof Filters, value: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value as Category | TransactionType | 'all' | 'date' | 'amount' | 'asc' | 'desc' | string,
      },
    }));
  },

  // A failed reload keeps the list that's already on screen
  fetchTransactions: async () => {
    const load = ++latestLoad;
    set({ loading: true });
    try {
      const res = await apiFetch('/api/transactions');
      const data = await res.json();
      if (load !== latestLoad) return;
      set({ transactions: Array.isArray(data) ? data : [], loading: false, loaded: true });
    } catch {
      if (load !== latestLoad) return;
      set({ loading: false, loaded: true });
      toast.error("Couldn't load your transactions. Please refresh the page.");
    }
  },

  // Writes throw if the server rejects them, so callers only report success when it happened
  addTransaction: async (t) => {
    await apiFetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    await get().fetchTransactions();
  },

  updateTransaction: async (id, updates) => {
    await apiFetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await get().fetchTransactions();
  },

  bulkDeleteTransactions: async (ids) => {
    await apiFetch('/api/transactions/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    await get().fetchTransactions();
  },

  importTransactions: async (txns) => {
    const res = await apiFetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: txns }),
    });
    const result: ImportResult = await res.json();
    await get().fetchTransactions();
    return result;
  },
}));
