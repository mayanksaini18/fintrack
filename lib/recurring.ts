import { and, eq, lte, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from '@/lib/db/schema';
import { recurringTransactions } from '@/lib/db/schema';
import type { Frequency } from '@/types';

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const DAY_MS = 24 * 60 * 60 * 1000;

// A missed date is still filled in if it falls on today or one of the 7 days before
// it (for example, the daily cron failed). Anything older is skipped, not backdated.
export const CATCH_UP_DAYS = 7;

// Recurring entries were not created from 22 Apr 2026 until this fix shipped. The
// owner chose to skip that backlog instead of backdating it.
export const SKIP_BEFORE = new Date('2026-11-01T00:00:00.000Z');

interface Schedule {
  frequency: Frequency;
  startDate: Date;
}

/** `start` moved forward by `count` periods, in UTC. Month ends clamp (Jan 31 → Feb 28) without drifting. */
export function addPeriods(start: Date, frequency: Frequency, count: number): Date {
  if (frequency === 'weekly') return new Date(start.getTime() + count * 7 * DAY_MS);

  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + (frequency === 'monthly' ? count : count * 12);
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const result = new Date(start);
  result.setUTCFullYear(year, month, Math.min(start.getUTCDate(), lastDayOfMonth));
  return result;
}

// Number of periods between the start date and `date`, rounded down. Only used as a
// starting point for the search in nextOnSchedule.
function periodsBetween({ frequency, startDate }: Schedule, date: Date): number {
  if (frequency === 'weekly') return Math.floor((date.getTime() - startDate.getTime()) / (7 * DAY_MS));
  const months =
    (date.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + (date.getUTCMonth() - startDate.getUTCMonth());
  return frequency === 'monthly' ? months : Math.floor(months / 12);
}

function nextOnSchedule(schedule: Schedule, from: Date, inclusive: boolean): Date {
  let count = Math.max(0, periodsBetween(schedule, from) - 1);
  let date = addPeriods(schedule.startDate, schedule.frequency, count);
  while (inclusive ? date < from : date <= from) {
    count++;
    date = addPeriods(schedule.startDate, schedule.frequency, count);
  }
  return date;
}

/**
 * The start of the user's current day in the app's UTC-midnight date convention. Uses the
 * browser's calendar date (YYYY-MM-DD) when it is within a day of the server's, so a user in
 * India just after midnight gets their own today rather than UTC's yesterday.
 */
export function startOfUserDay(today: string | undefined, now = new Date()): Date {
  const utcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const match = today?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const userDay = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Math.abs(userDay - utcDay) <= DAY_MS) return new Date(userDay);
  }
  return new Date(utcDay);
}

/** The end of the user's current day, or `now` if that is later. */
export function endOfUserDay(today: string | undefined, now = new Date()): Date {
  return new Date(Math.max(now.getTime(), startOfUserDay(today, now).getTime() + DAY_MS - 1));
}

/** The first date on the schedule that is on or after `from`. */
export function firstOccurrenceOnOrAfter(schedule: Schedule, from: Date): Date {
  return nextOnSchedule(schedule, from, true);
}

/**
 * Works out which due dates to turn into transactions. A date on or before `now` is created
 * if it falls inside the catch-up window, or comes before the item was created (the user
 * picked a past start date, so asked for it); otherwise it is skipped. Nothing before
 * SKIP_BEFORE is ever created. `nextDueDate` is the first date after `now`.
 */
export function planOccurrences(schedule: Schedule & { nextDueDate: Date; createdAt?: Date }, now: Date) {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const catchUpFrom = startOfToday - CATCH_UP_DAYS * DAY_MS;
  const requestedBefore = schedule.createdAt?.getTime() ?? -Infinity;

  const create: Date[] = [];
  let skipped = 0;
  let due = schedule.nextDueDate;
  while (due <= now) {
    const time = due.getTime();
    if (time >= SKIP_BEFORE.getTime() && (time >= catchUpFrom || time < requestedBefore)) create.push(due);
    else skipped++;
    due = nextOnSchedule(schedule, due, false);
  }

  return { create, skipped, nextDueDate: due };
}

/**
 * Turns due recurring items into transactions. With `userId` only that user's items
 * are processed (the "Process Due" button), and with `id` only that item (before it is
 * paused); without either, everyone's (the daily cron).
 */
export async function processDueRecurring(
  database: Database,
  { now = new Date(), userId, id }: { now?: Date; userId?: string; id?: string } = {},
) {
  const dueItems = await database
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextDueDate, now),
        userId ? eq(recurringTransactions.userId, userId) : undefined,
        id ? eq(recurringTransactions.id, id) : undefined,
      ),
    );

  let processed = 0;
  let created = 0;
  let skipped = 0;

  for (const item of dueItems) {
    // A row whose dates can't be read (such as a year typo) is left alone, so it can't stop the run for everyone else
    if (Number.isNaN(item.startDate.getTime()) || Number.isNaN(item.nextDueDate.getTime())) {
      console.error(`Recurring: skipping ${item.id}, its dates can't be read`);
      continue;
    }
    try {
      const result = await claimAndInsert(database, item, planOccurrences(item, now));
      if (result.claimed === 0) continue;
      processed++;
      created += result.inserted;
      skipped += result.skipped;
    } catch (err) {
      // The statement failed as a whole, so nothing moved for this item and the next run tries again
      console.error(`Recurring: could not process ${item.id}:`, err);
    }
  }

  return { processed, created, skipped };
}

async function claimAndInsert(
  database: Database,
  item: typeof recurringTransactions.$inferSelect,
  plan: ReturnType<typeof planOccurrences>,
) {
  const occurrences =
    plan.create.length > 0
      ? sql`VALUES ${sql.join(
          plan.create.map((date) => sql`(${crypto.randomUUID()}::text, ${date.toISOString()}::timestamptz)`),
          sql`, `,
        )}`
      : sql`SELECT NULL::text, NULL::timestamptz WHERE false`;

  // One statement, so it is all or nothing. The next due date only moves if it still
  // holds the value read above, and rows are inserted only when it moved, so a
  // repeated or overlapping run finds nothing left to claim.
  const result = await database.execute(sql`
    WITH claimed AS (
      UPDATE recurring_transactions
      SET next_due_date = ${plan.nextDueDate.toISOString()}::timestamptz
      WHERE id = ${item.id}
        AND date_trunc('milliseconds', next_due_date) = ${item.nextDueDate.toISOString()}::timestamptz
        AND is_active
      RETURNING user_id, amount, category, type, description
    ),
    occurrences (id, date) AS (${occurrences}),
    inserted AS (
      INSERT INTO transactions (id, user_id, date, amount, category, type, description)
      SELECT occurrences.id, claimed.user_id, occurrences.date, claimed.amount, claimed.category, claimed.type, claimed.description
      FROM claimed CROSS JOIN occurrences
      RETURNING 1
    )
    SELECT (SELECT count(*) FROM claimed)::int AS claimed, (SELECT count(*) FROM inserted)::int AS inserted
  `);
  // neon-http and PGlite both return { rows }.
  const [row] = (result as unknown as { rows: { claimed: number; inserted: number }[] }).rows;
  return { ...row, skipped: plan.skipped };
}
