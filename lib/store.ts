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
  // True when the last load failed, so an empty list isn't mistaken for an empty account
  loadError: boolean;
  // The account the list belongs to: a Clerk user id, null for the signed-out demo, undefined before the first load
  ownerId: string | null | undefined;
  // The Transactions page's current page, reset whenever a filter changes
  page: number;
  setRole: (role: Role) => void;
  setFilter: (key: keyof Filters, value: string) => void;
  setPage: (page: number) => void;
  fetchTransactions: (ownerId?: string | null) => Promise<void>;
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
  loadError: false,
  ownerId: undefined,
  page: 1,

  setRole: (role: Role) => set({ role }),

  setFilter: (key: keyof Filters, value: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value as Category | TransactionType | 'all' | 'date' | 'amount' | 'asc' | 'desc' | string,
      },
      page: 1,
    }));
  },

  setPage: (page: number) => set({ page }),

  // A failed reload keeps the list that's already on screen
  fetchTransactions: async (ownerId = get().ownerId) => {
    // Another account's list must never show, not even while this one loads
    if (ownerId !== get().ownerId) {
      set({ transactions: [], loaded: false, loadError: false, ownerId, filters: defaultFilters, page: 1 });
    }
    const load = ++latestLoad;
    set({ loading: true });
    try {
      const res = await apiFetch('/api/transactions');
      const data = await res.json();
      if (load !== latestLoad) return;
      set({ transactions: Array.isArray(data) ? data : [], loading: false, loaded: true, loadError: false });
    } catch {
      if (load !== latestLoad) return;
      set({ loading: false, loaded: true, loadError: true });
      toast.error("Couldn't load your transactions. Please try again.");
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
