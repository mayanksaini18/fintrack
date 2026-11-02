import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { createTestDb, type TestDb } from '@/test/db';
import { transactions } from '@/lib/db/schema';

const state = vi.hoisted(() => ({ db: null as unknown, userId: 'user_a' as string | null }));
vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: state.userId }) }));

const { POST } = await import('./route');

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  state.db = db;
  state.userId = 'user_a';
});

const row = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-10-05T00:00:00.000Z',
  amount: 450,
  category: 'Food',
  type: 'expense',
  description: 'Paid to Swiggy',
  ...overrides,
});

const importRows = async (rows: unknown[]) => {
  const res = await POST(
    new NextRequest('https://kharcha.store/api/transactions/bulk', { method: 'POST', body: JSON.stringify({ transactions: rows }) }),
  );
  return { status: res.status, body: await res.json() };
};

const savedFor = (userId: string) => db.select().from(transactions).where(eq(transactions.userId, userId));

describe('POST /api/transactions/bulk', () => {
  it('adds nothing the second time the same statement is imported', async () => {
    const statement = [row(), row({ date: '2026-10-06T00:00:00.000Z', amount: 1200, description: 'Groceries' })];

    expect((await importRows(statement)).body).toMatchObject({ inserted: 2, skipped: 0 });
    expect((await importRows(statement)).body).toMatchObject({ inserted: 0, skipped: 2 });
    expect(await savedFor('user_a')).toHaveLength(2);
  });

  it('only adds the new rows from an overlapping statement', async () => {
    await importRows([row()]);

    const { body } = await importRows([row(), row({ date: '2026-10-07T00:00:00.000Z', description: 'Uber trip', amount: 180 })]);

    expect(body).toMatchObject({ inserted: 1, skipped: 1 });
    expect(await savedFor('user_a')).toHaveLength(2);
  });

  it('keeps genuine repeats inside one statement', async () => {
    const twoChais = [row({ amount: 20, description: 'Chai' }), row({ amount: 20, description: 'Chai' })];

    expect((await importRows(twoChais)).body).toMatchObject({ inserted: 2, skipped: 0 });
    expect((await importRows(twoChais)).body).toMatchObject({ inserted: 0, skipped: 2 });
  });

  it('matches on the calendar day and ignores case and extra spaces in the description', async () => {
    await importRows([row({ date: '2026-10-05T00:00:00.000Z', description: 'Paid to Swiggy' })]);

    const { body } = await importRows([row({ date: '2026-10-05T14:30:00.000Z', description: '  paid  to SWIGGY ' })]);

    expect(body).toMatchObject({ inserted: 0, skipped: 1 });
  });

  it("does not count another user's transactions as duplicates", async () => {
    state.userId = 'user_b';
    await importRows([row()]);
    state.userId = 'user_a';

    expect((await importRows([row()])).body).toMatchObject({ inserted: 1, skipped: 0 });
  });

  it('skips and reports bad rows instead of failing the whole import', async () => {
    const { status, body } = await importRows([row(), row({ date: 'not a date' }), row({ amount: 0.4 }), row({ description: '' })]);

    expect(status).toBe(201);
    expect(body).toMatchObject({ inserted: 1, skipped: 0, invalid: 3 });
    expect(await savedFor('user_a')).toHaveLength(1);
  });

  it('rounds amounts and maps unknown categories to Other', async () => {
    await importRows([row({ amount: 249.5, category: 'Groceries' })]);

    const [saved] = await savedFor('user_a');
    expect(saved).toMatchObject({ amount: 250, category: 'Other' });
  });

  it('requires a signed-in user', async () => {
    state.userId = null;
    expect((await importRows([row()])).status).toBe(401);
  });
});
