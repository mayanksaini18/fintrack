import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { createTestDb, type TestDb } from '@/test/db';
import { recurringTransactions } from '@/lib/db/schema';

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: 'user_a' }) }));

const { PUT } = await import('./route');

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  state.db = db;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T04:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

async function addItem(values: { isActive: boolean; startDate: string; nextDueDate: string }) {
  await db.insert(recurringTransactions).values({
    id: 'netflix',
    userId: 'user_a',
    amount: 649,
    category: 'Entertainment',
    type: 'expense',
    description: 'Netflix',
    frequency: 'monthly',
    isActive: values.isActive,
    startDate: new Date(values.startDate),
    nextDueDate: new Date(values.nextDueDate),
  });
}

const put = (body: unknown) =>
  PUT(
    new NextRequest('https://kharcha.store/api/recurring/netflix', { method: 'PUT', body: JSON.stringify(body) }),
    { params: Promise.resolve({ id: 'netflix' }) },
  );

const stored = async () =>
  (await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, 'netflix')))[0];

describe('PUT /api/recurring/[id]', () => {
  it('skips the paused months when an item is resumed', async () => {
    await addItem({ isActive: false, startDate: '2026-01-15T00:00:00.000Z', nextDueDate: '2026-08-15T00:00:00.000Z' });

    const res = await put({ isActive: true });

    expect(res.status).toBe(200);
    const item = await stored();
    expect(item.isActive).toBe(true);
    expect(item.nextDueDate.toISOString()).toBe('2026-11-15T00:00:00.000Z');
  });

  it("keeps today's date when an item is resumed on its due day", async () => {
    await addItem({ isActive: false, startDate: '2026-01-02T00:00:00.000Z', nextDueDate: '2026-08-02T00:00:00.000Z' });

    await put({ isActive: true });

    expect((await stored()).nextDueDate.toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('leaves an overdue active item alone when asked to resume it again', async () => {
    await addItem({ isActive: true, startDate: '2026-01-01T00:00:00.000Z', nextDueDate: '2026-11-01T00:00:00.000Z' });

    await put({ isActive: true });

    expect((await stored()).nextDueDate.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('keeps the due date when an item is paused', async () => {
    await addItem({ isActive: true, startDate: '2026-01-01T00:00:00.000Z', nextDueDate: '2026-11-01T00:00:00.000Z' });

    await put({ isActive: false });

    const item = await stored();
    expect(item.isActive).toBe(false);
    expect(item.nextDueDate.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });
});
