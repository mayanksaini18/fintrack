import { beforeEach, describe, expect, it } from 'vitest';
import { asc, eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from '@/test/db';
import { recurringTransactions, transactions } from '@/lib/db/schema';
import { processDueRecurring } from './recurring';

const now = new Date('2026-11-02T04:00:00.000Z');

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
});

async function addRecurring(values: Partial<typeof recurringTransactions.$inferInsert> & { id: string; nextDueDate: Date }) {
  await db.insert(recurringTransactions).values({
    userId: 'user_a',
    amount: 15000,
    category: 'Rent',
    type: 'expense',
    description: 'Flat rent',
    frequency: 'monthly',
    startDate: values.nextDueDate,
    ...values,
  });
}

const nextDueOf = async (id: string) =>
  (await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id)))[0].nextDueDate.toISOString();

describe('processDueRecurring', () => {
  it('creates the entries that are due and moves the next date forward', async () => {
    await addRecurring({ id: 'rent', nextDueDate: new Date('2026-11-01T00:00:00.000Z') });

    const result = await processDueRecurring(db, { now });

    expect(result).toEqual({ processed: 1, created: 1, skipped: 0 });
    const rows = await db.select().from(transactions);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: 'user_a',
      amount: 15000,
      category: 'Rent',
      type: 'expense',
      description: 'Flat rent',
    });
    expect(rows[0].date.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(await nextDueOf('rent')).toBe('2026-12-01T00:00:00.000Z');
  });

  it('skips the April–October backlog without creating entries', async () => {
    await addRecurring({ id: 'rent', nextDueDate: new Date('2026-04-25T00:00:00.000Z') });

    const result = await processDueRecurring(db, { now });

    expect(result).toEqual({ processed: 1, created: 0, skipped: 7 });
    expect(await db.select().from(transactions)).toHaveLength(0);
    expect(await nextDueOf('rent')).toBe('2026-11-25T00:00:00.000Z');
  });

  it('does not create anything twice when it runs again', async () => {
    await addRecurring({ id: 'rent', nextDueDate: new Date('2026-11-01T00:00:00.000Z') });

    await processDueRecurring(db, { now });
    const second = await processDueRecurring(db, { now });

    expect(second).toEqual({ processed: 0, created: 0, skipped: 0 });
    expect(await db.select().from(transactions)).toHaveLength(1);
  });

  it('does not double up when two runs overlap', async () => {
    await addRecurring({
      id: 'gym',
      frequency: 'weekly',
      amount: 500,
      description: 'Gym',
      nextDueDate: new Date('2026-10-26T00:00:00.000Z'),
    });

    const results = await Promise.all([processDueRecurring(db, { now }), processDueRecurring(db, { now })]);

    expect(results.reduce((sum, r) => sum + r.processed, 0)).toBe(1);
    const rows = await db.select().from(transactions).orderBy(asc(transactions.date));
    // 26 Oct is before the 1 Nov cut-off; 2 Nov is today.
    expect(rows.map((r) => r.date.toISOString().slice(0, 10))).toEqual(['2026-11-02']);
  });

  it('only processes the given user when a userId is passed', async () => {
    await addRecurring({ id: 'mine', nextDueDate: new Date('2026-11-01T00:00:00.000Z') });
    await addRecurring({ id: 'theirs', userId: 'user_b', nextDueDate: new Date('2026-11-01T00:00:00.000Z') });

    const result = await processDueRecurring(db, { now, userId: 'user_a' });

    expect(result.processed).toBe(1);
    const rows = await db.select().from(transactions);
    expect(rows.map((r) => r.userId)).toEqual(['user_a']);
    expect(await nextDueOf('theirs')).toBe('2026-11-01T00:00:00.000Z');
  });

  it('leaves paused items alone', async () => {
    await addRecurring({ id: 'paused', isActive: false, nextDueDate: new Date('2026-11-01T00:00:00.000Z') });

    const result = await processDueRecurring(db, { now });

    expect(result).toEqual({ processed: 0, created: 0, skipped: 0 });
    expect(await nextDueOf('paused')).toBe('2026-11-01T00:00:00.000Z');
  });
});
