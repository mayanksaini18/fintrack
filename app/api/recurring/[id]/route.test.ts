import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { createTestDb, type TestDb } from '@/test/db';
import { recurringTransactions, transactions } from '@/lib/db/schema';

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

async function addItem(values: {
  isActive: boolean;
  startDate: string;
  nextDueDate: string;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  userId?: string;
}) {
  await db.insert(recurringTransactions).values({
    id: 'netflix',
    userId: values.userId ?? 'user_a',
    amount: 649,
    category: 'Entertainment',
    type: 'expense',
    description: 'Netflix',
    frequency: values.frequency ?? 'monthly',
    isActive: values.isActive,
    startDate: new Date(values.startDate),
    nextDueDate: new Date(values.nextDueDate),
    createdAt: new Date(values.startDate),
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

  it('creates what is already due before pausing, so resuming later skips only the paused dates', async () => {
    await addItem({ isActive: true, startDate: '2026-01-01T00:00:00.000Z', nextDueDate: '2026-11-01T00:00:00.000Z' });

    await put({ isActive: false });

    const item = await stored();
    expect(item.isActive).toBe(false);
    expect(item.nextDueDate.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect((await db.select().from(transactions)).map((t) => t.date.toISOString())).toEqual(['2026-11-01T00:00:00.000Z']);
  });

  it("keeps the entry due on the user's today when pausing just after midnight in India", async () => {
    // Weekly on Tuesdays. Tue 10 Nov 01:00 IST is still Mon 9 Nov in UTC, before the daily cron.
    vi.setSystemTime(new Date('2026-11-09T19:30:00.000Z'));
    await addItem({ isActive: true, frequency: 'weekly', startDate: '2026-11-03T00:00:00.000Z', nextDueDate: '2026-11-10T00:00:00.000Z' });

    await put({ isActive: false, today: '2026-11-10' });

    expect((await db.select().from(transactions)).map((t) => t.date.toISOString())).toEqual(['2026-11-10T00:00:00.000Z']);
  });

  it("uses the browser's date when resuming just after midnight in India", async () => {
    // Weekly on Mondays, paused since early November. Tue 10 Nov 01:00 IST is still Mon 9 Nov in UTC.
    vi.setSystemTime(new Date('2026-11-09T19:30:00.000Z'));
    await addItem({ isActive: false, frequency: 'weekly', startDate: '2026-10-26T00:00:00.000Z', nextDueDate: '2026-11-02T00:00:00.000Z' });

    await put({ isActive: true, today: '2026-11-10' });

    expect((await stored()).nextDueDate.toISOString()).toBe('2026-11-16T00:00:00.000Z');
  });

  it("ignores a browser date that is far from the server's", async () => {
    vi.setSystemTime(new Date('2026-11-09T19:30:00.000Z'));
    await addItem({ isActive: false, frequency: 'weekly', startDate: '2026-10-26T00:00:00.000Z', nextDueDate: '2026-11-02T00:00:00.000Z' });

    await put({ isActive: true, today: '2026-01-01' });

    expect((await stored()).nextDueDate.toISOString()).toBe('2026-11-09T00:00:00.000Z');
  });

  it('moves the next date onto the new schedule when the frequency changes', async () => {
    await addItem({ isActive: true, startDate: '2026-01-15T00:00:00.000Z', nextDueDate: '2026-11-15T00:00:00.000Z' });

    await put({ frequency: 'yearly' });

    const item = await stored();
    expect(item.frequency).toBe('yearly');
    expect(item.nextDueDate.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('rejects invalid or empty updates', async () => {
    await addItem({ isActive: true, startDate: '2026-01-01T00:00:00.000Z', nextDueDate: '2026-12-01T00:00:00.000Z' });

    expect((await put({ amount: 'lots' })).status).toBe(400);
    expect((await put({ amount: 12.5 })).status).toBe(400);
    expect((await put({})).status).toBe(400);
  });

  it("returns 404 for someone else's item", async () => {
    await addItem({ isActive: false, userId: 'user_b', startDate: '2026-01-15T00:00:00.000Z', nextDueDate: '2026-08-15T00:00:00.000Z' });

    expect((await put({ isActive: true })).status).toBe(404);
    expect((await stored()).isActive).toBe(false);
  });
});
