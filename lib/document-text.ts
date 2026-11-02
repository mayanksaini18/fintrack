import * as XLSX from 'xlsx';

/** The text of an uploaded statement: CSV and text as-is, each Excel sheet as CSV, PDF pages as text. */
export async function extractTextFromFile(file: File): Promise<string> {
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
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
