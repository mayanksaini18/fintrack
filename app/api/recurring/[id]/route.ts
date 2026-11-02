import { db } from '@/lib/db';
import { recurringTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { endOfUserDay, firstOccurrenceOnOrAfter, processDueRecurring, startOfUserDay } from '@/lib/recurring';
import { recurringUpdateSchema } from '@/lib/validation';
import type { NextRequest } from 'next/server';

const updateSchema = recurringUpdateSchema.omit({ startDate: true }).extend({
  isActive: z.boolean().optional(),
  // The browser's calendar date (YYYY-MM-DD), so resuming uses the user's today
  today: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const { today, ...changes } = parsed.data;
    if (Object.keys(changes).length === 0) return Response.json({ error: 'Nothing to update' }, { status: 400 });

    const whereMine = and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId));
    const loadCurrent = async () => (await db.select().from(recurringTransactions).where(whereMine))[0];
    let current = await loadCurrent();
    if (!current) return Response.json({ error: 'Recurring item not found' }, { status: 404 });

    // Pausing first creates anything due up to the end of the user's today (the cron would create
    // today's entry later), so a later resume only skips dates that fell in the pause
    if (changes.isActive === false && current.isActive) {
      await processDueRecurring(db, { userId, id, now: endOfUserDay(today) });
      current = (await loadCurrent()) ?? current;
    }

    const updates: Partial<typeof recurringTransactions.$inferInsert> = { ...changes };

    // Resuming skips the dates that passed while the item was paused
    if (changes.isActive === true && !current.isActive) {
      const startOfToday = startOfUserDay(today);
      if (current.nextDueDate < startOfToday) updates.nextDueDate = firstOccurrenceOnOrAfter(current, startOfToday);
    }

    // A new frequency moves the next date onto the new schedule
    if (changes.frequency && changes.frequency !== current.frequency) {
      updates.nextDueDate = firstOccurrenceOnOrAfter(
        { startDate: current.startDate, frequency: changes.frequency },
        updates.nextDueDate ?? current.nextDueDate
      );
    }

    await db.update(recurringTransactions).set(updates).where(whereMine);

    return Response.json({ id, ...changes });
  } catch (err) {
    console.error('PUT /api/recurring/[id]:', err);
    return Response.json({ error: 'Failed to update recurring transaction' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await db
      .delete(recurringTransactions)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

    return Response.json({ deleted: id });
  } catch (err) {
    console.error('DELETE /api/recurring/[id]:', err);
    return Response.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}
