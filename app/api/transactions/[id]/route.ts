import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { transactionUpdateSchema } from '@/lib/validation';
import type { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = transactionUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (parsed.data.date) updates.date = new Date(parsed.data.date);
    if (parsed.data.amount !== undefined) updates.amount = parsed.data.amount;
    if (parsed.data.category) updates.category = parsed.data.category;
    if (parsed.data.type) updates.type = parsed.data.type;
    if (parsed.data.description) updates.description = parsed.data.description;

    await db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    return Response.json({ id, ...parsed.data });
  } catch (err) {
    console.error('PUT /api/transactions/[id]:', err);
    return Response.json({ error: 'Failed to update transaction' }, { status: 500 });
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
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    return Response.json({ deleted: id });
  } catch (err) {
    console.error('DELETE /api/transactions/[id]:', err);
    return Response.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
