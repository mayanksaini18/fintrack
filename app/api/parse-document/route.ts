import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { auth } from '@clerk/nextjs/server';
import * as XLSX from 'xlsx';

const SYSTEM_PROMPT = `You are a financial document parser. Extract ALL transactions from the provided document content.

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

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return Response.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  try {
    const text = await extractTextFromFile(file);

    if (!text.trim()) {
      return Response.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    const truncated = text.slice(0, 15000);

    const { text: result } = await generateText({
      model: anthropic('claude-sonnet-4.5'),
      system: SYSTEM_PROMPT,
      prompt: `Parse transactions from this ${file.name} document:\n\n${truncated}`,
    });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const transactions = JSON.parse(cleaned);

    if (!Array.isArray(transactions)) {
      return Response.json({ error: 'Failed to parse transactions' }, { status: 500 });
    }

    return Response.json({ transactions, filename: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse document';
    return Response.json({ error: message }, { status: 500 });
  }
}
