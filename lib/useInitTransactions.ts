'use client';

import { useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';

export function useInitTransactions() {
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);
  const loading = useFinanceStore((s) => s.loading);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { loading };
}
