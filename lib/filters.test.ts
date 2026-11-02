import { describe, expect, it } from 'vitest';
import { applyFilters } from './filters';
import type { Filters, Transaction } from '@/types';

const all: Transaction[] = [
  { id: 'a', date: '2026-10-05T00:00:00.000Z', amount: 450, category: 'Food', type: 'expense', description: 'Swiggy dinner' },
  { id: 'b', date: '2026-10-01T00:00:00.000Z', amount: 85000, category: 'Salary', type: 'income', description: 'October salary' },
  { id: 'c', date: '2026-10-03T00:00:00.000Z', amount: 1200, category: 'Food', type: 'expense', description: 'Groceries at DMart' },
  { id: 'd', date: '2026-09-28T00:00:00.000Z', amount: 50, category: 'Transport', type: 'expense', description: 'Metro 50% off' },
];

const base: Filters = { search: '', category: 'all', type: 'all', sortBy: 'date', sortOrder: 'desc' };
const ids = (list: Transaction[]) => list.map((t) => t.id);

describe('applyFilters', () => {
  it('returns everything newest first by default', () => {
    expect(ids(applyFilters(all, base))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('searches descriptions without caring about case or spaces around the query', () => {
    expect(ids(applyFilters(all, { ...base, search: '  swiggy ' }))).toEqual(['a']);
  });

  it('treats % in the search as a normal character', () => {
    expect(ids(applyFilters(all, { ...base, search: '50%' }))).toEqual(['d']);
  });

  it('filters by category and type together', () => {
    expect(ids(applyFilters(all, { ...base, category: 'Food', type: 'expense' }))).toEqual(['a', 'c']);
    expect(ids(applyFilters(all, { ...base, category: 'Food', type: 'income' }))).toEqual([]);
  });

  it('sorts by amount and by date in either direction', () => {
    expect(ids(applyFilters(all, { ...base, sortBy: 'amount', sortOrder: 'desc' }))).toEqual(['b', 'c', 'a', 'd']);
    expect(ids(applyFilters(all, { ...base, sortBy: 'amount', sortOrder: 'asc' }))).toEqual(['d', 'a', 'c', 'b']);
    expect(ids(applyFilters(all, { ...base, sortOrder: 'asc' }))).toEqual(['d', 'b', 'c', 'a']);
  });

  it('does not change the list it was given', () => {
    const copy = [...all];
    applyFilters(all, { ...base, sortBy: 'amount', sortOrder: 'asc' });
    expect(all).toEqual(copy);
  });
});
