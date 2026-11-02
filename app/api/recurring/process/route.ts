import { db } from '@/lib/db';
import { processDueRecurring } from '@/lib/recurring';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Called by Vercel Cron daily — secured with CRON_SECRET header
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('Recurring cron: CRON_SECRET is not set, refusing to run');
    return Response.json({ error: 'Cron is not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processDueRecurring(db);
    console.log(
      `Recurring cron: processed ${result.processed} items, created ${result.created} transactions, skipped ${result.skipped} missed dates`
    );
    return Response.json(result);
  } catch (err) {
    console.error('Recurring cron:', err);
    return Response.json({ error: 'Failed to process recurring transactions' }, { status: 500 });
  }
}

// "Process Due" button — only the signed-in user's items
export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await processDueRecurring(db, { userId });
    return Response.json(result);
  } catch (err) {
    console.error('POST /api/recurring/process:', err);
    return Response.json({ error: 'Failed to process recurring transactions' }, { status: 500 });
  }
}
