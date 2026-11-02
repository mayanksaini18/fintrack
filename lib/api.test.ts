import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('returns the response when the request succeeds', async () => {
    respond(201, { id: 'tx_1' });
    const res = await apiFetch('/api/transactions', { method: 'POST' });
    expect(await res.json()).toEqual({ id: 'tx_1' });
  });

  it("throws the server's message when it sends one", async () => {
    respond(500, { error: 'Failed to create transaction' });
    await expect(apiFetch('/api/transactions')).rejects.toThrow('Failed to create transaction');
  });

  it('throws a readable message for validation errors', async () => {
    respond(400, { error: { fieldErrors: { amount: ['Expected integer'] } } });
    await expect(apiFetch('/api/transactions')).rejects.toThrow(/check/i);
  });

  it('throws when the response is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Not found</html>', { status: 404 })));
    await expect(apiFetch('/api/transactions')).rejects.toThrow();
  });
});
