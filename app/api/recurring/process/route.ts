import { db } from '@/lib/db';
import { recurringTransactions, transactions } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

// Called by Vercel Cron daily — secured with CRON_SECRET header
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const dueItems = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextDueDate, now)
      )
    );

  let created = 0;

  for (const item of dueItems) {
    let dueDate = new Date(item.nextDueDate);

    while (dueDate <= now) {
      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId: item.userId,
        date: dueDate,
        amount: item.amount,
        category: item.category,
        type: item.type,
        description: item.description,
      });
      created++;
      dueDate = getNextDate(dueDate, item.frequency);
    }

    await db
      .update(recurringTransactions)
      .set({ nextDueDate: dueDate })
      .where(eq(recurringTransactions.id, item.id));
  }

  console.log(`Recurring cron: processed ${dueItems.length} items, created ${created} transactions`);
  return Response.json({ processed: dueItems.length, created });
}
