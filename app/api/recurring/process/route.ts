import { db } from '@/lib/db';
import { recurringTransactions, transactions } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();

  const dueItems = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
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
        userId,
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

  return Response.json({ processed: dueItems.length, created });
}
