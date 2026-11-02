import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { inArray, eq, and, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

const MAX_ROWS = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORIES = transactions.category.enumValues;
type Category = (typeof CATEGORIES)[number];

// Imported rows come from statement parsers and the AI, so each is checked on its own: a bad
// row is skipped and counted instead of failing the whole import. Amounts round to whole rupees.
const rowSchema = z.object({
  date: z
    .string()
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime())),
  amount: z.coerce
    .number()
    .transform(Math.round)
    .refine((n) => Number.isFinite(n) && n >= 1),
  category: z.string().transform((c): Category => (CATEGORIES.includes(c as Category) ? (c as Category) : 'Other')),
  type: z.string().transform((t): 'income' | 'expense' => (t === 'income' ? 'income' : 'expense')),
  description: z
    .string()
    .trim()
    .min(1)
    .transform((d) => d.slice(0, 200)),
});

// Same calendar day, amount, type and description (ignoring case and extra spaces)
const duplicateKey = (t: { date: Date; amount: number; type: string; description: string }) =>
  [t.date.toISOString().slice(0, 10), t.amount, t.type, t.description.trim().replace(/\s+/g, ' ').toLowerCase()].join('|');

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.transactions) || body.transactions.length === 0)
    return Response.json({ error: 'No transactions provided' }, { status: 400 });
  if (body.transactions.length > MAX_ROWS)
    return Response.json({ error: `Max ${MAX_ROWS} transactions per import` }, { status: 400 });

  const rows: z.infer<typeof rowSchema>[] = [];
  let invalid = 0;
  for (const raw of body.transactions) {
    const parsed = rowSchema.safeParse(raw);
    if (parsed.success) rows.push(parsed.data);
    else invalid++;
  }

  try {
    // Rows that are already saved are skipped one for one, so importing a statement again adds
    // nothing while genuine repeats inside one statement (two ₹20 chais) are still kept.
    const toInsert: typeof rows = [];
    let skipped = 0;
    if (rows.length > 0) {
      const times = rows.map((r) => r.date.getTime());
      const from = new Date(Math.floor(Math.min(...times) / DAY_MS) * DAY_MS);
      const to = new Date(Math.floor(Math.max(...times) / DAY_MS) * DAY_MS + DAY_MS);
      const existing = await db
        .select({ date: transactions.date, amount: transactions.amount, type: transactions.type, description: transactions.description })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lt(transactions.date, to)));

      const saved = new Map<string, number>();
      for (const t of existing) saved.set(duplicateKey(t), (saved.get(duplicateKey(t)) ?? 0) + 1);
      for (const r of rows) {
        const left = saved.get(duplicateKey(r)) ?? 0;
        if (left > 0) {
          saved.set(duplicateKey(r), left - 1);
          skipped++;
        } else {
          toInsert.push(r);
        }
      }
    }

    if (toInsert.length > 0) {
      await db.insert(transactions).values(toInsert.map((r) => ({ id: crypto.randomUUID(), userId, ...r })));
    }
    return Response.json({ inserted: toInsert.length, skipped, invalid }, { status: toInsert.length > 0 ? 201 : 200 });
  } catch (err) {
    console.error('Bulk insert error:', err);
    return Response.json({ error: 'Failed to insert transactions' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!Array.isArray(body.ids) || body.ids.length === 0)
    return Response.json({ error: 'No ids provided' }, { status: 400 });
  if (body.ids.length > 500)
    return Response.json({ error: 'Max 500 deletions per request' }, { status: 400 });

  try {
    await db
      .delete(transactions)
      .where(and(inArray(transactions.id, body.ids), eq(transactions.userId, userId)));
  } catch (err) {
    console.error('Bulk delete error:', err);
    return Response.json({ error: 'Failed to delete transactions' }, { status: 500 });
  }

  return Response.json({ deleted: body.ids.length });
}
