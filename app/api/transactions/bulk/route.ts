import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const items = body.transactions as Array<{
    date: string;
    amount: number;
    category: string;
    type: string;
    description: string;
  }>;

  const values = items.map((t) => ({
    id: crypto.randomUUID(),
    date: new Date(t.date),
    amount: t.amount,
    category: t.category as typeof transactions.category.enumValues[number],
    type: t.type as 'income' | 'expense',
    description: t.description,
  }));

  await db.insert(transactions).values(values);

  return Response.json({ inserted: values.length }, { status: 201 });
}
