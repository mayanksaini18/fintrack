import { generateText } from 'ai';
import { AI_MODEL } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { ok } = rateLimit(userId, 5, 60_000);
  if (!ok) return Response.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });

  const allTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(200);

  if (allTx.length < 3) {
    return Response.json({
      insights: 'Add at least 3 transactions to get AI-powered insights about your spending patterns.',
    });
  }

  const summary = allTx.map((t) => ({
    date: t.date.toISOString().split('T')[0],
    amount: t.amount,
    category: t.category,
    type: t.type,
    description: t.description,
  }));

  const { text } = await generateText({
    model: AI_MODEL,
    system: `You are a personal finance advisor analyzing a user's transaction data.
Give concise, actionable insights in plain language. Use Indian Rupee (₹) for amounts.
Format your response as 4-6 bullet points using markdown. Each bullet should be a specific,
data-driven insight — not generic advice. Include specific numbers and percentages.
Keep the tone friendly and encouraging.`,
    prompt: `Analyze these transactions and give me personalized financial insights:\n\n${JSON.stringify(summary)}`,
  });

  return Response.json({ insights: text });
}
