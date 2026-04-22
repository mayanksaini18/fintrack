import { db } from '@/lib/db';
import { budgets, transactions } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { budgetSchema } from '@/lib/validation';
import type { NextRequest } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthTx = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );

  const spentByCategory: Record<string, number> = {};
  for (const tx of monthTx) {
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  }

  const result = allBudgets.map((b) => ({
    id: b.id,
    category: b.category,
    monthlyLimit: b.monthlyLimit,
    spent: spentByCategory[b.category] || 0,
  }));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const id = crypto.randomUUID();
    await db.insert(budgets).values({ id, userId, ...parsed.data });

    return Response.json({ id, ...parsed.data, spent: 0 }, { status: 201 });
  } catch (err) {
    console.error('POST /api/budgets:', err);
    return Response.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
