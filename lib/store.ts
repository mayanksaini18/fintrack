'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
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
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
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

  // A failed reload keeps the list that's already on screen
  fetchTransactions: async () => {
    set({ loading: true });
    const query = buildQuery(get().filters);
    try {
      const res = await apiFetch(`/api/transactions?${query}`);
      const data = await res.json();
      set({ transactions: Array.isArray(data) ? data : [], loading: false });
    } catch {
      set({ loading: false });
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
    await apiFetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: txns }),
    });
    await get().fetchTransactions();
  },
}));
