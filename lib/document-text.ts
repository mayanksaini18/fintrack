import * as XLSX from 'xlsx';

// Enough for a long statement, and small enough that a hostile file can't keep the server busy
const MAX_SHEETS = 10;
const MAX_ROWS = 5000;
const MAX_COLUMNS = 100;
const MAX_PAGES = 50;

/** A file Kharcha can't read as it is. The message says why, and is safe to show the user. */
export class UnreadableFileError extends Error {}

const LOCKED_PDF =
  'This PDF is password-protected. Open it, save a copy without the password (for example with Print → Save as PDF), and upload that copy.';

/**
 * The text of an uploaded statement: CSV and text as-is, each Excel sheet as CSV, PDF pages as
 * text. Stops early once `maxChars` is reached; `complete` is false when sheets or pages were
 * left out.
 */
export async function extractTextFromFile(file: File, maxChars = Infinity): Promise<{ text: string; complete: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === 'csv' || ext === 'txt') {
    return { text: buffer.toString('utf-8'), complete: true };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    // nodim sizes a sheet by its real cells, not the range it claims (a 6 KB file can claim a
    // million rows); the clamp below covers formats that ignore nodim
    const workbook = XLSX.read(buffer, { type: 'buffer', nodim: true, sheetRows: MAX_ROWS });
    const sheets: string[] = [];
    let length = 0;
    for (const name of workbook.SheetNames.slice(0, MAX_SHEETS)) {
      const sheet = workbook.Sheets[name];
      if (sheet['!ref']) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        range.e.r = Math.min(range.e.r, range.s.r + MAX_ROWS - 1);
        range.e.c = Math.min(range.e.c, range.s.c + MAX_COLUMNS - 1);
        sheet['!ref'] = XLSX.utils.encode_range(range);
      }
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`Sheet: ${name}\n${csv}`);
      length += csv.length;
      if (length > maxChars) break;
    }
    return { text: sheets.join('\n\n'), complete: workbook.SheetNames.length <= MAX_SHEETS };
  }

  if (ext === 'pdf') {
    const { getDocumentProxy } = await import('unpdf');
    // Banks often lock statements with a password, which pdf.js reports as a PasswordException
    const pdf = await getDocumentProxy(new Uint8Array(buffer)).catch((error: unknown) => {
      throw (error as Error)?.name === 'PasswordException' ? new UnreadableFileError(LOCKED_PDF) : error;
    });
    const pages: string[] = [];
    let length = 0;
    for (let number = 1; number <= Math.min(pdf.numPages, MAX_PAGES) && length <= maxChars; number++) {
      const content = await (await pdf.getPage(number)).getTextContent();
      const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      pages.push(text);
      length += text.length;
    }
    return { text: pages.join('\n'), complete: pdf.numPages <= MAX_PAGES };
  }

  throw new UnreadableFileError(`Unsupported file type: .${ext}`);
}
