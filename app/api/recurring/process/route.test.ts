import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, type TestDb } from '@/test/db';
import { recurringTransactions, transactions } from '@/lib/db/schema';

const state = vi.hoisted(() => ({ db: null as unknown, userId: null as string | null }));
vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: state.userId }) }));

const { GET, POST } = await import('./route');

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  state.db = db;
  state.userId = null;
  // Due today, so whichever day the test runs it is inside the catch-up window.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const userId of ['user_a', 'user_b']) {
    await db.insert(recurringTransactions).values({
      id: `rent-${userId}`,
      userId,
      amount: 15000,
      category: 'Rent',
      type: 'expense',
      description: 'Flat rent',
      frequency: 'monthly',
      startDate: today,
      nextDueDate: today,
    });
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const cronRequest = (authorization?: string) =>
  new NextRequest('https://kharcha.store/api/recurring/process', {
    headers: authorization ? { authorization } : {},
  });

describe('GET /api/recurring/process (daily cron)', () => {
  it('refuses to run when CRON_SECRET is not set, even for "Bearer undefined"', async () => {
    vi.stubEnv('CRON_SECRET', undefined);

    const res = await GET(cronRequest('Bearer undefined'));

    expect(res.status).toBe(500);
    expect(await db.select().from(transactions)).toHaveLength(0);
  });

  it('rejects a wrong secret', async () => {
    vi.stubEnv('CRON_SECRET', 'right-secret');

    const res = await GET(cronRequest('Bearer wrong-secret'));

    expect(res.status).toBe(401);
    expect(await db.select().from(transactions)).toHaveLength(0);
  });

  it("processes every user's due items with the right secret", async () => {
    vi.stubEnv('CRON_SECRET', 'right-secret');

    const res = await GET(cronRequest('Bearer right-secret'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 2, created: 2, skipped: 0 });
    expect(await db.select().from(transactions)).toHaveLength(2);
  });
});

describe('POST /api/recurring/process ("Process Due" button)', () => {
  it('requires a signed-in user', async () => {
    const res = await POST();

    expect(res.status).toBe(401);
    expect(await db.select().from(transactions)).toHaveLength(0);
  });

  it("processes only the signed-in user's items", async () => {
    state.userId = 'user_a';

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 1, created: 1, skipped: 0 });
    const rows = await db.select().from(transactions);
    expect(rows.map((r) => r.userId)).toEqual(['user_a']);
  });
});
