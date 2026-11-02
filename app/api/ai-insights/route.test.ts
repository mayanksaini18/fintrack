import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '@/test/db';
import { fakeAnthropic, type CapturedRequest } from '@/test/anthropic';
import { transactions } from '@/lib/db/schema';

const state = vi.hoisted(() => ({ model: null as unknown, db: null as unknown, userId: 'user_a' as string | null }));
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: state.userId }) }));
vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('@/lib/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai')>();
  return {
    ...actual,
    get AI_MODEL() {
      return state.model;
    },
  };
});

const { GET } = await import('./route');

let requests: CapturedRequest[];
function claudeReplies(text: string, stopReason?: string) {
  const fake = fakeAnthropic({ text, stopReason });
  state.model = fake.model;
  requests = fake.requests;
}

let users = 0;
beforeEach(async () => {
  const db = await createTestDb();
  state.db = db;
  state.userId = `user_${++users}`;
  for (const [i, amount] of [450, 1200, 85000].entries()) {
    await db.insert(transactions).values({
      id: `tx_${i}`,
      userId: state.userId,
      date: new Date(`2026-10-0${i + 1}T00:00:00.000Z`),
      amount,
      category: i === 2 ? 'Salary' : 'Food',
      type: i === 2 ? 'income' : 'expense',
      description: `Entry ${i}`,
    });
  }
  claudeReplies('- **Food** is 2% of your income');
});

describe('GET /api/ai-insights', () => {
  it('asks Claude Sonnet 5.5 at low effort, with a fallback and an output budget', async () => {
    await GET();

    const [{ body }] = requests;
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.max_tokens).toBe(4000);
    expect(body).toMatchObject({ output_config: { effort: 'low' }, fallbacks: 'default' });
    for (const field of ['temperature', 'top_p', 'top_k']) expect(body).not.toHaveProperty(field);
  });

  it("returns Claude's insights", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ insights: '- **Food** is 2% of your income' });
  });

  it('explains when Claude declines', async () => {
    claudeReplies('', 'refusal');

    const res = await GET();

    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/couldn't/i);
  });
});
