import { db } from '@/lib/db';
import { budgets } from '@/lib/db/schema';
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

    await db
      .update(budgets)
      .set({ monthlyLimit: body.monthlyLimit })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

    return Response.json({ id, ...body });
  } catch (err) {
    console.error('PUT /api/budgets/[id]:', err);
    return Response.json({ error: 'Failed to update budget' }, { status: 500 });
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
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

    return Response.json({ deleted: id });
  } catch (err) {
    console.error('DELETE /api/budgets/[id]:', err);
    return Response.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
