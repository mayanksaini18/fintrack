'use client';

import { useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';

export function useInitTransactions() {
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);
  const loaded = useFinanceStore((s) => s.loaded);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Only the first load shows a spinner; reloads update the page in place
  return { loading: !loaded };
}
