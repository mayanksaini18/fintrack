import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { lockedPdf, tinyPdf } from '@/test/anthropic';
import { extractTextFromFile } from './document-text';

const asFile = (bytes: Uint8Array<ArrayBuffer>, name: string) => new File([bytes], name);

// A real 16 KB workbook whose sheet claims the whole grid (A1:XFD1048576), as a hostile upload can
function workbookClaimingHugeRange(): Uint8Array<ArrayBuffer> {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Date', 'Narration', 'Debit'], ['05/10/2026', 'Swiggy order', 249.5]]), 'October');
  const zip = XLSX.CFB.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  const sheet = XLSX.CFB.find(zip, '/xl/worksheets/sheet1.xml')!;
  const xml = Buffer.from(sheet.content as Uint8Array).toString('utf8');
  sheet.content = Buffer.from(xml.replace(/<dimension ref="[^"]*"\/>/, '<dimension ref="A1:XFD1048576"/>'));
  return new Uint8Array(XLSX.CFB.write(zip, { type: 'buffer', fileType: 'zip' }) as Buffer);
}

describe('extractTextFromFile limits', () => {
  it('reads only the real cells of a sheet that claims a huge range', async () => {
    const started = Date.now();
    const { text } = await extractTextFromFile(asFile(workbookClaimingHugeRange(), 'statement.xlsx'));

    expect(Date.now() - started).toBeLessThan(3000);
    expect(text).toContain('Swiggy order');
  }, 10_000);

  it('stops after 50 PDF pages and says the text is incomplete', async () => {
    const pages = Array.from({ length: 60 }, (_, i) => `Page ${i + 1} marker`);
    const { text, complete } = await extractTextFromFile(asFile(new Uint8Array(tinyPdf(pages)), 'statement.pdf'));

    expect(text).toContain('Page 50 marker');
    expect(text).not.toContain('Page 51 marker');
    expect(complete).toBe(false);
  });

  it('reads a short PDF completely', async () => {
    const { text, complete } = await extractTextFromFile(asFile(new Uint8Array(tinyPdf(['Paid to Swiggy', 'Paid to Uber'])), 'statement.pdf'));

    expect(text).toContain('Paid to Swiggy');
    expect(text).toContain('Paid to Uber');
    expect(complete).toBe(true);
  });
});

describe('extractTextFromFile on files it cannot open', () => {
  it('explains how to upload a password-protected PDF', async () => {
    await expect(extractTextFromFile(asFile(new Uint8Array(lockedPdf()), 'statement.pdf'))).rejects.toThrow(
      'This PDF is password-protected. Open it, save a copy without the password (for example with Print → Save as PDF), and upload that copy.',
    );
  });
});
