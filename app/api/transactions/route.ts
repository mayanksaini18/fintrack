import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { desc, asc, ilike, eq, and, SQL } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { mockTransactions } from '@/lib/mock-data';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(mockTransactions);
  }

  const url = request.nextUrl;
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const sortBy = url.searchParams.get('sortBy') || 'date';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  const conditions: SQL[] = [eq(transactions.userId, userId)];

  if (search) {
    conditions.push(ilike(transactions.description, `%${search}%`));
  }
  if (category !== 'all') {
    conditions.push(eq(transactions.category, category as typeof transactions.category.enumValues[number]));
  }
  if (type !== 'all') {
    conditions.push(eq(transactions.type, type as 'income' | 'expense'));
  }

  const orderCol = sortBy === 'amount' ? transactions.amount : transactions.date;
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const results = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(orderFn(orderCol));

  const mapped = results.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    amount: r.amount,
    category: r.category,
    type: r.type,
    description: r.description,
  }));

  return Response.json(mapped);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const id = crypto.randomUUID();

    await db.insert(transactions).values({
      id,
      userId,
      date: new Date(body.date),
      amount: body.amount,
      category: body.category,
      type: body.type,
      description: body.description,
    });

    return Response.json({ id, ...body }, { status: 201 });
  } catch (err) {
    console.error('POST /api/transactions:', err);
    return Response.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
