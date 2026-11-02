import { Category, Transaction, TransactionType } from '@/types';
import { CATEGORIES } from '@/lib/categories';

// ─── CSV line parser ──────────────────────────────────────────────────────────
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      // "" inside a quoted field is a literal quote
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; continue; }
      inQuotes = !inQuotes;
      continue;
    }
    if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += line[i];
  }
  result.push(current.trim());
  return result;
}

// ─── Category rules ───────────────────────────────────────────────────────────
export function mapCategory(paytmTag: string, description: string): Category {
  const tag = paytmTag.toLowerCase();
  const desc = description.toLowerCase();

  if (tag.includes('food') || tag.includes('groceries')) return 'Food';
  if (tag.includes('shopping')) return 'Shopping';

  if (tag.includes('bill')) {
    if (
      desc.includes('jio') || desc.includes('airtel') || desc.includes('vi ') ||
      desc.includes('bsnl') || desc.includes('recharge') || desc.includes('electricity') ||
      desc.includes('bescom') || desc.includes('tata power') || desc.includes('wifi') ||
      desc.includes('broadband') || desc.includes('internet')
    ) return 'Utilities';
    return 'Other'; // credit card bills, etc.
  }

  if (tag.includes('investment')) return 'Other';

  // Description fallbacks
  if (desc.includes('salary') || desc.includes('payroll')) return 'Salary';
  if (desc.includes('rent')) return 'Rent';
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('rapido') ||
      desc.includes('petrol') || desc.includes('metro') || desc.includes('irctc') ||
      desc.includes('flight') || desc.includes('fastag')) return 'Transport';
  if (desc.includes('apollo') || desc.includes('hospital') || desc.includes('pharmacy') ||
      desc.includes('medical') || desc.includes('doctor')) return 'Healthcare';
  if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('dominos') ||
      desc.includes('cafe') || desc.includes('restaurant') || desc.includes('tiffins') ||
      desc.includes('food')) return 'Food';
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') ||
      desc.includes('ajio') || desc.includes('nykaa')) return 'Shopping';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime') ||
      desc.includes('hotstar') || desc.includes('pvr') || desc.includes('bookmyshow')) return 'Entertainment';

  return 'Other';
}

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
}

// ─── Paytm-specific parser ────────────────────────────────────────────────────
// Paytm CSV format: each transaction spans 3-5 rows.
// Row 0: "DD Mon" | Description | Tag: | Bank | "± Rs.Amount"
// Row 1: "H:MM AM/PM" | (name cont.) | (note cont.) | (bank cont.) | -
// Row 2: "" | "UPI ID: ..." | "# Category" | "Bank-XXXX" | -
// Row 3: "" | "UPI Ref No: ..." | ... | - | -
// Row 4 (sometimes): "" | "Order ID: ..." | - | - | -
// Self-transfers have no ± sign and are followed by "Note: This payment is not included..."

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const DATE_RE = /^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;

// "2026-10-01T00:00:00.000Z", or null for impossible dates like 31 Feb (Date would roll them over)
function isoDay(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date.toISOString()
    : null;
}

const IST_OFFSET_MS = 330 * 60 * 1000;

// Paytm rows only say "DD Mon", so the year is worked out by walking the payments from newest
// to oldest: the year steps back whenever the dates jump forward by months (back across New
// Year), steps forward again for a row slightly out of order just after New Year, and no date
// is ever after today.
function assignYears(dates: { month: number; day: number }[], today: Date): number[] {
  const dayOfYear = (d: { month: number; day: number }) => DAYS_BEFORE_MONTH[d.month - 1] + d.day;

  // Statements are normally newest first, but check: each pair of neighbours votes, taking the
  // short way round New Year (2 Jan → 28 Dec is 5 days back, not 360 forward).
  let votes = 0;
  for (let i = 1; i < dates.length; i++) {
    let step = dayOfYear(dates[i]) - dayOfYear(dates[i - 1]);
    if (step > 182) step -= 365;
    else if (step < -182) step += 365;
    votes += Math.sign(step);
  }
  const newestFirst = dates.map((_, i) => i);
  if (votes > 0) newestFirst.reverse();

  // Paytm dates are Indian calendar days, so compare them with today's date in India
  const india = new Date(today.getTime() + IST_OFFSET_MS);
  const thisYear = india.getUTCFullYear();
  const todayDay = DAYS_BEFORE_MONTH[india.getUTCMonth()] + india.getUTCDate();

  const years: number[] = [];
  let year = thisYear;
  let previous = todayDay;
  for (const i of newestFirst) {
    const current = dayOfYear(dates[i]);
    if (current - previous > 182) year--;
    else if (previous - current > 182) year++;
    while (year > thisYear || (year === thisYear && current > todayDay)) year--;
    years[i] = year;
    previous = current;
  }
  return years;
}

const SKIP_RE = [
  /^Page\d+of\d+/i,
  /^Passbook Payments/i,
  /^All payments done/i,
  /^Date &/i,
  /^,Transaction Details/i,
  /^Time,/i,
  /^Note: This payment is not included/i,
  /^For any queries/i,
  /^Contact Us/i,
  /^Paytm Statement/i,
  /^Accounts,/i,
  /^Gold Coins/i,
  /^Tamilnad Mercantile/i,
  /^Kotak Mahindra/i,
  /^\d+ Payments/i,
];

export function parsePaytm(csvText: string, today = new Date()): { rows: ParsedRow[]; errors: string[] } {
  const rawLines = csvText.split('\n');
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  // Group raw lines into transaction blocks
  // A block starts when col[0] matches DD Mon pattern
  const blocks: string[][][] = []; // array of blocks, each block = array of parsed CSV rows
  let currentBlock: string[][] | null = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Skip known boilerplate lines
    if (SKIP_RE.some((r) => r.test(trimmed))) {
      // A page break ends the current block too
      if (currentBlock && currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    const cols = parseCSVLine(trimmed);
    const col0 = cols[0]?.trim() ?? '';

    if (DATE_RE.test(col0)) {
      // Save previous block, start new one
      if (currentBlock && currentBlock.length > 0) blocks.push(currentBlock);
      currentBlock = [cols];
    } else if (currentBlock) {
      currentBlock.push(cols);
    }
  }
  if (currentBlock && currentBlock.length > 0) blocks.push(currentBlock);

  // Parse each block. Years are filled in afterwards, once every payment's day and month is known.
  const payments: (Omit<ParsedRow, 'date'> & { month: number; day: number })[] = [];
  for (const block of blocks) {
    const firstRow = block[0];
    const dateStr = firstRow[0]?.trim() ?? '';
    const description = firstRow[1]?.trim() ?? '';
    const amountStr = firstRow[4]?.trim() ?? '';

    // Skip self transfers (no ± prefix)
    if (!amountStr.startsWith('+') && !amountStr.startsWith('-')) continue;
    if (description.toLowerCase().includes('transferred to self')) continue;
    if (block.some((r) => r.join(',').toLowerCase().includes('# self transfer'))) continue;

    // Parse date
    const dm = dateStr.match(DATE_RE);
    if (!dm) continue;
    const day = Number(dm[1]);
    const month = MONTHS.indexOf(dm[2]) + 1;

    // Parse amount: "- Rs.1,249.50" → 1250 (amounts are stored in whole rupees)
    const isIncome = amountStr.startsWith('+');
    const amount = Math.round(parseFloat(amountStr.slice(1).replace(/rs\.?|₹|,|\s/gi, '')));
    if (!(amount > 0)) {
      errors.push(`Skipped: "${description}" — amount "${amountStr}" is not readable or is under ₹1`);
      continue;
    }

    // Extract Paytm tag from all rows' col[2]
    let paytmTag = '';
    for (const r of block) {
      const col2 = r[2]?.trim() ?? '';
      if (col2.startsWith('#')) { paytmTag = col2; break; }
    }

    const type: TransactionType = isIncome ? 'income' : 'expense';
    const category = mapCategory(paytmTag, description);

    payments.push({ month, day, description, amount, type, category });
  }

  const years = assignYears(payments, today);
  payments.forEach(({ month, day, ...row }, i) => {
    const date = isoDay(years[i], month, day);
    if (date) rows.push({ date, ...row });
    else errors.push(`Skipped: "${row.description}" — no ${day} ${MONTHS[month - 1]} in ${years[i]}`);
  });

  return { rows, errors };
}

// ─── Generic CSV parser (fallback for non-Paytm) ──────────────────────────────
const SHORT_DATE = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;

export function parseGeneric(csvText: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = csvText.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['File is empty'] };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const descIdx = headers.findIndex((h) =>
    h.includes('narration') || h.includes('particular') || h.includes('description') || h.includes('details')
  );
  const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('withdrawal'));
  const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('deposit'));
  const amountIdx = headers.findIndex((h) => h === 'amount' || h === 'amt');
  // Kharcha's own export (and some banks) also say which way money went, and the category
  const typeIdx = headers.findIndex((h) => h === 'type' || h === 'transactiontype' || h === 'drcr' || h === 'crdr');
  const categoryIdx = headers.findIndex((h) => h === 'category');

  if (dateIdx === -1 || descIdx === -1 || (debitIdx === -1 && creditIdx === -1 && amountIdx === -1)) {
    return { rows: [], errors: ['Could not detect columns. Expected Date, Description, and Debit/Credit or Amount columns.'] };
  }

  // A single Amount column either marks spending with a minus (bank style) or lists spending as
  // plain numbers with refunds negative (card style). Whichever kind of row is more common decides.
  const cells = amountIdx === -1 ? [] : lines.slice(1).map((l) => readAmountCell(parseCSVLine(l)[amountIdx] ?? ''));
  const negatives = cells.filter((c) => c.mark === null && c.negative).length;
  const plain = cells.filter((c) => c.mark === null && !c.negative).length;
  const minusMeansSpending = negatives >= plain;

  // 05/10/2026 is read day first, as Indian banks write dates, unless a date like 10/31/2026
  // shows that the file puts the month first (and no date shows the opposite)
  const shortDates = lines
    .slice(1)
    .map((l) => (parseCSVLine(l)[dateIdx] ?? '').trim().match(SHORT_DATE))
    .filter((d) => d !== null);
  const monthFirst = shortDates.some((d) => +d[2] > 12) && !shortDates.some((d) => +d[1] > 12);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const rawDate = cols[dateIdx]?.trim() ?? '';
    // A leading ' is how the export stops a description running as a spreadsheet formula
    const description = (cols[descIdx]?.trim() ?? `Transaction ${i}`).replace(/^'(?=[=+\-@])/, '');

    // DD-MM-YYYY (or MM-DD-YYYY, see above) or YYYY-MM-DD, with - or /
    const short = rawDate.match(SHORT_DATE);
    const ymd = rawDate.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    const isoDate = short
      ? monthFirst ? isoDay(+short[3], +short[1], +short[2]) : isoDay(+short[3], +short[2], +short[1])
      : ymd ? isoDay(+ymd[1], +ymd[2], +ymd[3]) : null;
    if (!isoDate) { errors.push(`Row ${i + 1}: bad date "${rawDate}" — skipped`); continue; }

    let amount = 0;
    let type: TransactionType = 'expense';
    if (amountIdx !== -1) {
      const cell = readAmountCell(cols[amountIdx] ?? '');
      const category = mapCategory('', description);
      amount = cell.amount;
      const plainIsIncome = minusMeansSpending || category === 'Salary' || category === 'Freelance';
      type =
        cell.mark ??
        readTypeCell(cols[typeIdx]) ??
        (cell.negative ? (minusMeansSpending ? 'expense' : 'income') : plainIsIncome ? 'income' : 'expense');
    } else {
      const debit = parseFloat((cols[debitIdx] ?? '').replace(/[₹,\s]/g, '')) || 0;
      const credit = parseFloat((cols[creditIdx] ?? '').replace(/[₹,\s]/g, '')) || 0;
      if (credit > 0) { amount = Math.round(credit); type = 'income'; }
      else if (debit > 0) { amount = Math.round(debit); type = 'expense'; }
      else continue;
    }
    if (!(amount > 0)) { errors.push(`Row ${i + 1}: bad amount — skipped`); continue; }

    rows.push({ date: isoDate, description, amount, type, category: readCategoryCell(cols[categoryIdx]) ?? mapCategory('', description) });
  }
  return { rows, errors };
}

function readCategoryCell(raw: string | undefined): Category | null {
  const value = raw?.trim().toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === value) ?? null;
}

// "income"/"credit"/"Cr" or "expense"/"debit"/"Dr"; anything else (e.g. "UPI") says nothing
function readTypeCell(raw: string | undefined): TransactionType | null {
  const value = raw?.trim().toLowerCase().replace(/\.$/, '');
  if (value === 'income' || value === 'credit' || value === 'cr') return 'income';
  if (value === 'expense' || value === 'debit' || value === 'dr') return 'expense';
  return null;
}

// The amount in a cell, rounded to whole rupees ("Rs.1,249.50" → 1250), and which way the money
// went when the cell says so: Dr or Cr (before or after the number) or a leading +. A minus or
// brackets only says "negative"; what that means depends on the file (see parseGeneric).
function readAmountCell(raw: string): { amount: number; mark: TransactionType | null; negative: boolean } {
  const text = raw.trim();
  const number = text.match(/\d[\d,]*(?:\.\d+)?/);
  const beforeNumber = number ? text.slice(0, number.index) : text;
  const says = (word: string) => new RegExp(`(?:^|[^a-z])${word}\\.?(?:[^a-z]|$)`, 'i').test(text);
  return {
    amount: number ? Math.round(parseFloat(number[0].replace(/,/g, ''))) : NaN,
    mark: says('dr') ? 'expense' : says('cr') || beforeNumber.includes('+') ? 'income' : null,
    negative: beforeNumber.includes('-') || /^\(.*\)$/.test(text),
  };
}

export function isPaytmFormat(csvText: string): boolean {
  const top = csvText.slice(0, 400).toLowerCase();
  return top.includes('passbook payments history') || top.includes('paytm statement') || top.includes('total money paid');
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  invalid: number;
}

// "Imported 48 transactions. 2 were already in Kharcha."
export function describeImport({ inserted, skipped, invalid }: ImportResult): string {
  const parts = [inserted === 0 ? 'Nothing new to import.' : `Imported ${inserted} transaction${inserted === 1 ? '' : 's'}.`];
  if (skipped > 0) parts.push(`${skipped} ${skipped === 1 ? 'was' : 'were'} already in Kharcha.`);
  if (invalid > 0) parts.push(`${invalid} couldn't be read and ${invalid === 1 ? 'was' : 'were'} skipped.`);
  return parts.join(' ');
}

// A leading = + - @ (or tab/CR) makes a spreadsheet run the cell as a formula
const FORMULA_START = /^[=+\-@\t\r]/;
const quoted = (value: string) => `"${value.replace(/"/g, '""')}"`;

/**
 * The transactions as CSV that spreadsheets open safely and Kharcha can import again:
 * calendar dates, quoted descriptions, and a leading ' on anything that would run as a formula.
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  const lines = transactions.map((t) =>
    [
      t.date.slice(0, 10),
      quoted(FORMULA_START.test(t.description) ? `'${t.description}` : t.description),
      t.category,
      t.type,
      String(t.amount),
    ].join(',')
  );
  return ['Date,Description,Category,Type,Amount', ...lines].join('\n');
}
