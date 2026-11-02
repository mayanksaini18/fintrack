import { createAnthropic } from '@ai-sdk/anthropic';

export interface CapturedRequest {
  body: Record<string, unknown>;
  headers: Headers;
}

/**
 * The real Anthropic provider, pointed at a fake fetch: each request is recorded and answered
 * with a canned Messages API response, so tests see exactly what would be sent to Anthropic.
 */
export function fakeAnthropic(reply: { text: string; stopReason?: string }) {
  const requests: CapturedRequest[] = [];
  const provider = createAnthropic({
    apiKey: 'test-key',
    fetch: async (_url, init) => {
      requests.push({ body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) });
      return new Response(
        JSON.stringify({
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-5-5',
          content: [{ type: 'text', text: reply.text }],
          stop_reason: reply.stopReason ?? 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });
  return { model: provider('claude-sonnet-5-5'), requests };
}
