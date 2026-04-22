import { generateText } from 'ai';
import { AI_MODEL } from '@/lib/ai';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const PARSE_PROMPT = `You are a financial document parser. Extract ALL transactions from the provided document content.

Return a JSON array of transactions. Each transaction must have:
- date: ISO date string (YYYY-MM-DD). If only month/year, use the 1st of that month.
- amount: number (positive, no currency symbols)
- type: "income" or "expense"
- category: one of: Salary, Freelance, Food, Transport, Entertainment, Shopping, Healthcare, Utilities, Rent, Other
- description: short description of the transaction

Rules:
- Credits/deposits/salary/received = "income"
- Debits/payments/purchases/withdrawals = "expense"
- Categorize intelligently based on description (e.g., "Swiggy" = Food, "Uber" = Transport, "Netflix" = Entertainment)
- If unsure about category, use "Other"
- Return ONLY the JSON array, no markdown, no explanation
- Parse ALL rows, don't skip any`;

const CHAT_PROMPT = `You are Kharcha AI — a friendly personal finance assistant. You help users understand their spending, give advice, and answer finance questions.

Rules:
- Use Indian Rupee (₹) for all amounts
- Be concise and actionable
- Use markdown formatting for readability
- If the user asks about their data, analyze the transaction summary provided
- Keep responses under 200 words unless the user asks for detail`;

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === 'csv' || ext === 'txt') {
    return buffer.toString('utf-8');
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: string[] = [];
    for (const name of workbook.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
      sheets.push(`Sheet: ${name}\n${csv}`);
    }
    return sheets.join('\n\n');
  }

  if (ext === 'pdf') {
    const pdfModule = await import('pdf-parse');
    const pdfParse = (pdfModule as any).default || pdfModule;
    const data = await pdfParse(buffer);
    return data.text;
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        return Response.json({ error: 'Could not extract text from file' }, { status: 400 });
      }

      const truncated = text.slice(0, 15000);
      const { text: result } = await generateText({
        model: AI_MODEL,
        system: PARSE_PROMPT,
        prompt: `Parse transactions from this ${file.name} document:\n\n${truncated}`,
      });

      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        return Response.json({
          role: 'assistant',
          content: "I couldn't parse any transactions from that file. Try a different format.",
          transactions: null,
        });
      }

      return Response.json({
        role: 'assistant',
        content: `I found **${parsed.length} transactions** in **${file.name}**. Review them below and import the ones you want.`,
        transactions: parsed,
        filename: file.name,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('AI Chat parse error:', msg);
      return Response.json({
        role: 'assistant',
        content: `Sorry, I couldn't parse that file. Error: ${msg}`,
        transactions: null,
      });
    }
  }

  const body = await request.json();
  const { message } = body;

  if (!message) {
    return Response.json({ error: 'No message provided' }, { status: 400 });
  }

  const allTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(100);

  const txSummary = allTx.length > 0
    ? `\n\nUser's recent transactions (${allTx.length} total):\n${JSON.stringify(
        allTx.map((t) => ({
          date: t.date.toISOString().split('T')[0],
          amount: t.amount,
          category: t.category,
          type: t.type,
          description: t.description,
        }))
      )}`
    : '\n\nThe user has no transactions yet.';

  const { text } = await generateText({
    model: AI_MODEL,
    system: CHAT_PROMPT + txSummary,
    prompt: message,
  });

  return Response.json({
    role: 'assistant',
    content: text,
    transactions: null,
  });
}
