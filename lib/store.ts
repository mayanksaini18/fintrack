'use client';

import { create } from 'zustand';
import { Transaction, Role, Filters, Category, TransactionType } from '@/types';

interface FinanceStore {
  transactions: Transaction[];
  role: Role;
  filters: Filters;
  loading: boolean;
  setRole: (role: Role) => void;
  setFilter: (key: keyof Filters, value: string) => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importTransactions: (txns: Omit<Transaction, 'id'>[]) => Promise<void>;
}

const defaultFilters: Filters = {
  search: '',
  category: 'all',
  type: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.type !== 'all') params.set('type', filters.type);
  params.set('sortBy', filters.sortBy);
  params.set('sortOrder', filters.sortOrder);
  return params.toString();
}

export const useFinanceStore = create<FinanceStore>()((set, get) => ({
  transactions: [],
  role: 'admin',
  filters: defaultFilters,
  loading: true,

  setRole: (role: Role) => set({ role }),

  setFilter: (key: keyof Filters, value: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value as Category | TransactionType | 'all' | 'date' | 'amount' | 'asc' | 'desc' | string,
      },
    }));
    get().fetchTransactions();
  },

  fetchTransactions: async () => {
    set({ loading: true });
    const query = buildQuery(get().filters);
    const res = await fetch(`/api/transactions?${query}`);
    const data = await res.json();
    set({ transactions: data, loading: false });
  },

  addTransaction: async (t) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    await get().fetchTransactions();
  },

  updateTransaction: async (id, updates) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await get().fetchTransactions();
  },

  importTransactions: async (txns) => {
    const res = await fetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: txns }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Import failed');
    }
    await get().fetchTransactions();
  },
}));
