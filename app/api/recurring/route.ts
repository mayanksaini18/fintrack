import { db } from '@/lib/db';
import { recurringTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const results = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.userId, userId))
    .orderBy(desc(recurringTransactions.createdAt));

  const mapped = results.map((r) => ({
    id: r.id,
    amount: r.amount,
    category: r.category,
    type: r.type,
    description: r.description,
    frequency: r.frequency,
    startDate: r.startDate.toISOString(),
    nextDueDate: r.nextDueDate.toISOString(),
    isActive: r.isActive,
  }));

  return Response.json(mapped);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const startDate = new Date(body.startDate);

    await db.insert(recurringTransactions).values({
      id,
      userId,
      amount: body.amount,
      category: body.category,
      type: body.type,
      description: body.description,
      frequency: body.frequency,
      startDate,
      nextDueDate: startDate,
      isActive: true,
    });

    return Response.json({ id, ...body }, { status: 201 });
  } catch (err) {
    console.error('POST /api/recurring:', err);
    return Response.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
