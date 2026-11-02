import type { Filters, Transaction } from '@/types';

/** The Transactions page's search, filters and sort, applied to the full list in the browser. */
export function applyFilters(transactions: Transaction[], filters: Filters): Transaction[] {
  const search = filters.search.trim().toLowerCase();
  const direction = filters.sortOrder === 'asc' ? 1 : -1;
  const sortValue = (t: Transaction) => (filters.sortBy === 'amount' ? t.amount : Date.parse(t.date));

  return transactions
    .filter(
      (t) =>
        (!search || t.description.toLowerCase().includes(search)) &&
        (filters.category === 'all' || t.category === filters.category) &&
        (filters.type === 'all' || t.type === filters.type)
    )
    .sort((a, b) => (sortValue(a) - sortValue(b)) * direction);
}
