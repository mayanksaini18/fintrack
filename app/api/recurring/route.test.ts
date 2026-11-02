import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestDb } from '@/test/db';
import { recurringTransactions } from '@/lib/db/schema';

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

const item = (id: string, date: string) => ({
  id,
  userId: 'user_a',
  amount: 649,
  category: 'Entertainment' as const,
  type: 'expense' as const,
  description: id,
  frequency: 'monthly' as const,
  startDate: new Date(date),
  nextDueDate: new Date(date),
});

describe('GET /api/recurring', () => {
  it("still lists everything when one item's dates can't be read, so it can be deleted", async () => {
    await db.insert(recurringTransactions).values([item('netflix', '2026-11-15T00:00:00.000Z'), item('typo', '0026-11-15T00:00:00.000Z')]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((r: { id: string; nextDueDate: string | null }) => [r.id, r.nextDueDate]).sort()).toEqual([
      ['netflix', '2026-11-15T00:00:00.000Z'],
      ['typo', null],
    ]);
  });
});
