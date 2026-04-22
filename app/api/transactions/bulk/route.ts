import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const items = body.transactions as Array<{
    date: string;
    amount: number;
    category: string;
    type: string;
    description: string;
  }>;

  const VALID_CATEGORIES = ['Salary','Freelance','Food','Transport','Entertainment','Shopping','Healthcare','Utilities','Rent','Other'] as const;

  const values = items.map((t) => ({
    id: crypto.randomUUID(),
    userId,
    date: new Date(t.date),
    amount: Math.round(Number(t.amount)),
    category: (VALID_CATEGORIES.includes(t.category as typeof VALID_CATEGORIES[number]) ? t.category : 'Other') as typeof transactions.category.enumValues[number],
    type: (t.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
    description: String(t.description),
  }));

  try {
    await db.insert(transactions).values(values);
  } catch (err) {
    console.error('Bulk insert error:', err);
    return Response.json({ error: 'Failed to insert transactions' }, { status: 500 });
  }

  return Response.json({ inserted: values.length }, { status: 201 });
}
