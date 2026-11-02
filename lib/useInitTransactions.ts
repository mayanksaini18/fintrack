'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useFinanceStore } from '@/lib/store';

export function useInitTransactions() {
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);
  const loaded = useFinanceStore((s) => s.loaded);
  const loadError = useFinanceStore((s) => s.loadError);
  const { isLoaded, userId } = useAuth();

  // Load once Clerk knows who is signed in, and again whenever that changes, so one
  // account's list (or the demo) never shows for another
  useEffect(() => {
    if (isLoaded) fetchTransactions(userId ?? null);
  }, [isLoaded, userId, fetchTransactions]);

  // Only the first load shows a spinner; reloads update the page in place
  return { loading: !loaded, loadError, retry: () => fetchTransactions() };
}
