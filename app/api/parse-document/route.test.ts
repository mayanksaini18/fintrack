import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { fakeAnthropic, lockedPdf, tinyPdf, type CapturedRequest } from '@/test/anthropic';

const state = vi.hoisted(() => ({ model: null as unknown, userId: 'user_a' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: state.userId }) }));
vi.mock('@/lib/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai')>();
  return {
    ...actual,
    get AI_MODEL() {
      return state.model;
    },
  };
});

const { POST } = await import('./route');

const parsed = {
  transactions: [{ date: '2026-10-05', amount: 249.5, type: 'expense', category: 'Food', description: 'Paid to Swiggy' }],
};

let requests: CapturedRequest[];
function claudeReplies(text: string, stopReason?: string) {
  const fake = fakeAnthropic({ text, stopReason });
  state.model = fake.model;
  requests = fake.requests;
}

// A new user per test, so the per-user rate limit doesn't carry over between tests
let users = 0;
beforeEach(() => {
  state.userId = `user_${++users}`;
  claudeReplies(JSON.stringify(parsed));
});

const upload = (content: string | Uint8Array<ArrayBuffer>, name = 'statement.csv') => {
  const form = new FormData();
  form.append('file', new File([content], name));
  return POST(new Request('https://kharcha.store/api/parse-document', { method: 'POST', body: form }));
};

describe('POST /api/parse-document', () => {
  it('asks Claude Sonnet 5.5 at low effort, with a fallback and an output budget, and no sampling settings', async () => {
    await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50');

    const [{ body, headers }] = requests;
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.max_tokens).toBe(32000);
    expect(body).toMatchObject({ output_config: { effort: 'low', format: { type: 'json_schema' } }, fallbacks: 'default' });
    for (const field of ['temperature', 'top_p', 'top_k', 'tool_choice']) expect(body).not.toHaveProperty(field);
    expect(headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
  });

  it('returns the transactions Claude found', async () => {
    const res = await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ transactions: parsed.transactions, filename: 'statement.csv', truncated: false, unreadable: 0 });
  });

  it('reads well past the old 15,000-character cut-off', async () => {
    await upload('x'.repeat(20_000) + 'LAST-LINE-MARKER');

    expect(JSON.stringify(requests[0].body)).toContain('LAST-LINE-MARKER');
  });

  it('says so when a statement is too long to read in full', async () => {
    const res = await upload('y'.repeat(70_000) + 'NEVER-SENT');

    expect((await res.json()).truncated).toBe(true);
    expect(JSON.stringify(requests[0].body)).not.toContain('NEVER-SENT');
  });

  it('explains when Claude declines to read the document', async () => {
    claudeReplies('', 'refusal');

    const res = await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50');

    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/couldn't read/i);
  });

  it('asks for a smaller file when the reply ran out of room', async () => {
    claudeReplies('{"transactions":[{"date":"2026-10-05","amount":2', 'max_tokens');

    const res = await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50');

    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/smaller/i);
  });

  it('limits how often one person can parse documents', async () => {
    for (let i = 0; i < 5; i++) expect((await upload('a,b,c')).status).toBe(200);

    expect((await upload('a,b,c')).status).toBe(429);
  });

  it('reads the text of a PDF statement', async () => {
    const res = await upload(new Uint8Array(tinyPdf('Paid to Swiggy 249.50')), 'statement.pdf');

    expect(res.status).toBe(200);
    expect(JSON.stringify(requests[0].body)).toContain('Paid to Swiggy 249.50');
  });

  it('asks for an unlocked copy of a password-protected PDF, without calling Claude', async () => {
    const res = await upload(new Uint8Array(lockedPdf()), 'statement.pdf');

    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/^This PDF is password-protected\./);
    expect(requests).toHaveLength(0);
  });

  it('names a file type it cannot read', async () => {
    const res = await upload('PK', 'statement.docx');

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('Unsupported file type: .docx');
  });

  it('reads every sheet of an Excel statement', async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Date', 'Narration', 'Debit'], ['05/10/2026', 'Swiggy order', 249.5]]), 'October');
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Date', 'Narration', 'Debit'], ['02/11/2026', 'Uber trip', 180]]), 'November');
    const file = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const res = await upload(new Uint8Array(file), 'statement.xlsx');

    expect(res.status).toBe(200);
    const sent = JSON.stringify(requests[0].body);
    expect(sent).toContain('Swiggy order');
    expect(sent).toContain('Uber trip');
  });

  it('leaves out and counts rows whose dates the model got wrong', async () => {
    const good = parsed.transactions[0];
    claudeReplies(JSON.stringify({ transactions: [good, { ...good, date: '05/10/2026' }, { ...good, date: '0026-10-05' }] }));

    const body = await (await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50')).json();

    expect(body.transactions).toEqual([good]);
    expect(body.unreadable).toBe(2);
  });

  it('keeps a very long file name out of the prompt', async () => {
    await upload('Date,Description,Amount\n05/10/2026,Paid to Swiggy,-249.50', `${'a'.repeat(5000)}.csv`);

    expect(JSON.stringify(requests[0].body)).not.toContain('a'.repeat(200));
  });

  it('requires a signed-in user', async () => {
    state.userId = null;

    expect((await upload('a,b,c')).status).toBe(401);
  });
});
