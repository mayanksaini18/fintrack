import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, type TestDb } from '@/test/db';
import { transactions } from '@/lib/db/schema';

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: 'user_a' }) }));

const { GET } = await import('./route');

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  state.db = db;
});

const tx = (id: string, date: string) => ({
  id,
  userId: 'user_a',
  date: new Date(date),
  amount: 450,
  category: 'Food' as const,
  type: 'expense' as const,
  description: id,
});

describe('GET /api/transactions', () => {
  it("still loads the list when one transaction's date can't be read", async () => {
    await db.insert(transactions).values([tx('lunch', '2026-11-01T00:00:00.000Z'), tx('typo', '0026-11-01T00:00:00.000Z')]);

    const res = await GET(new NextRequest('https://kharcha.store/api/transactions'));

    expect(res.status).toBe(200);
    expect((await res.json()).map((t: { id: string }) => t.id)).toEqual(['lunch']);
  });
});
