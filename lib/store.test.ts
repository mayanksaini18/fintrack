import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFinanceStore } from './store';

const tx = { date: '2026-11-01T00:00:00.000Z', amount: 250, category: 'Food' as const, type: 'expense' as const, description: 'Lunch' };

// Answers each request in order; anything after the list is a successful empty list.
function serverReplies(...replies: { status: number; body: unknown }[]) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
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

  it('importTransactions reports how many rows were added, skipped and unreadable', async () => {
    serverReplies({ status: 201, body: { inserted: 3, skipped: 2, invalid: 1 } });
    await expect(useFinanceStore.getState().importTransactions([tx])).resolves.toEqual({ inserted: 3, skipped: 2, invalid: 1 });
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

describe('finance store reads', () => {
  it('changing a filter does not go back to the server', async () => {
    const fetchMock = serverReplies();
    useFinanceStore.getState().setFilter('search', 'swiggy');
    useFinanceStore.getState().setFilter('category', 'Food');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('always loads the full list, whatever the filters, so the dashboard sees everything', async () => {
    const fetchMock = serverReplies();
    useFinanceStore.setState({ filters: { search: 'swiggy', category: 'Food', type: 'expense', sortBy: 'amount', sortOrder: 'asc' } });
    await useFinanceStore.getState().fetchTransactions();
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).not.toMatch(/search|category|type=/);
  });

  it('marks the first load as done, and a later reload keeps it done', async () => {
    serverReplies();
    useFinanceStore.setState({ loaded: false });
    await useFinanceStore.getState().fetchTransactions();
    expect(useFinanceStore.getState().loaded).toBe(true);

    const reload = useFinanceStore.getState().fetchTransactions();
    expect(useFinanceStore.getState().loaded).toBe(true);
    await reload;
  });

  it('ignores an older reply that arrives after a newer one', async () => {
    const older = { id: 'old', ...tx };
    const newer = { id: 'new', ...tx };
    let releaseOlder: () => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(
          () => new Promise<Response>((resolve) => { releaseOlder = () => resolve(new Response(JSON.stringify([older]))); }),
        )
        .mockImplementationOnce(async () => new Response(JSON.stringify([newer]))),
    );

    const first = useFinanceStore.getState().fetchTransactions();
    await useFinanceStore.getState().fetchTransactions();
    releaseOlder();
    await first;

    expect(useFinanceStore.getState().transactions).toEqual([newer]);
  });
});
