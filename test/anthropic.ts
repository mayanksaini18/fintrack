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

/** A PDF with one page per text, built byte by byte so tests need no fixture file. */
export function tinyPdf(text: string | string[]): Buffer {
  const texts = Array.isArray(text) ? text : [text];
  // Objects: 1 catalog, 2 pages, 3 font, then a page and its content stream for each text
  const pageIds = texts.map((_, i) => 4 + i * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${texts.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ...texts.flatMap((t, i) => {
      const content = `BT /F1 18 Tf 20 100 Td (${t}) Tj ET`;
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 144] /Contents ${pageIds[i] + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      ];
    }),
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
