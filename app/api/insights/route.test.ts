import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('GET /api/insights', () => {
  it("still works when one transaction's date can't be read", async () => {
    await db.insert(transactions).values([
      { id: 'rent', userId: 'user_a', date: new Date('2026-10-01T00:00:00.000Z'), amount: 15000, category: 'Rent', type: 'expense', description: 'Rent' },
      { id: 'typo', userId: 'user_a', date: new Date('0026-10-04T00:00:00.000Z'), amount: 99999, category: 'Food', type: 'expense', description: 'Year typo' },
    ]);

    expect((await GET()).status).toBe(200);
  });
});
