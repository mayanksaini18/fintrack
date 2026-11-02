import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFinanceStore } from './store';

const tx = { date: '2026-11-01T00:00:00.000Z', amount: 250, category: 'Food' as const, type: 'expense' as const, description: 'Lunch' };

// Answers each request in order; anything after the list is a successful empty list.
function serverReplies(...replies: { status: number; body: unknown }[]) {
  const fetchMock = vi.fn(async () => {
    const next = replies.shift() ?? { status: 200, body: [] };
    return new Response(JSON.stringify(next.body), { status: next.status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  useFinanceStore.setState({ transactions: [], loading: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('finance store writes', () => {
  it('addTransaction rejects when the server refuses the save', async () => {
    serverReplies({ status: 400, body: { error: { fieldErrors: { amount: ['Expected integer'] } } } });
    await expect(useFinanceStore.getState().addTransaction(tx)).rejects.toThrow();
  });

  it('updateTransaction rejects when the server fails', async () => {
    serverReplies({ status: 500, body: { error: 'Failed to update transaction' } });
    await expect(useFinanceStore.getState().updateTransaction('tx_1', { amount: 300 })).rejects.toThrow('Failed to update transaction');
  });

  it('deleteTransaction rejects when the server fails', async () => {
    serverReplies({ status: 500, body: { error: 'Failed to delete transaction' } });
    await expect(useFinanceStore.getState().deleteTransaction('tx_1')).rejects.toThrow('Failed to delete transaction');
  });

  it('bulkDeleteTransactions rejects when the server fails', async () => {
    serverReplies({ status: 500, body: { error: 'Failed to delete transactions' } });
    await expect(useFinanceStore.getState().bulkDeleteTransactions(['tx_1'])).rejects.toThrow('Failed to delete transactions');
  });

  it('a successful save reloads the list', async () => {
    const saved = { id: 'tx_1', ...tx };
    serverReplies({ status: 201, body: saved }, { status: 200, body: [saved] });
    await useFinanceStore.getState().addTransaction(tx);
    expect(useFinanceStore.getState().transactions).toEqual([saved]);
  });

  it('keeps the list and stops loading when a reload fails', async () => {
    const existing = { id: 'tx_0', ...tx };
    useFinanceStore.setState({ transactions: [existing] });
    serverReplies({ status: 500, body: { error: 'boom' } });
    await useFinanceStore.getState().fetchTransactions();
    expect(useFinanceStore.getState().transactions).toEqual([existing]);
    expect(useFinanceStore.getState().loading).toBe(false);
  });
});
