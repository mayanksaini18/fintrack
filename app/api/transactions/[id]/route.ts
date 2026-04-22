import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
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

    const updates: Record<string, unknown> = {};
    if (body.date) updates.date = new Date(body.date);
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.category) updates.category = body.category;
    if (body.type) updates.type = body.type;
    if (body.description) updates.description = body.description;

    await db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    return Response.json({ id, ...body });
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
