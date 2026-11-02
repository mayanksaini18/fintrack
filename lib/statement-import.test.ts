import { describe, expect, it } from 'vitest';
import { describeImport, parseGeneric, parsePaytm, transactionsToCSV } from './statement-import';

const today = new Date('2026-11-02T10:00:00+05:30');

// One Paytm payment in the statement's multi-row layout.
const payment = (date: string, description: string, amount: string, tag = '# Food') =>
  [
    `${date},${description},Tag:,Kotak Mahindra Bank,"${amount}"`,
    '9:15 PM,,,,',
    `,UPI ID: someone@okaxis,${tag},Kotak Bank-1234,`,
    ',UPI Ref No: 512345678901,,,',
  ].join('\n');

const paytmStatement = (...payments: string[]) =>
  ['Paytm Statement for 98XXXXXX10', 'Passbook Payments History', 'Date & Time,Transaction Details,Notes & Tags,Your Account,Amount', ...payments].join('\n');

const dates = (rows: { date: string }[]) => rows.map((r) => r.date.slice(0, 10));

describe('parsePaytm', () => {
  it('keeps the decimal point in amounts', () => {
    const { rows } = parsePaytm(paytmStatement(payment('22 Apr', 'Paid to Swiggy', '- Rs.249.50')), today);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(250);
    expect(rows[0].type).toBe('expense');
  });

  it('reads amounts with thousands separators', () => {
    const { rows } = parsePaytm(paytmStatement(payment('1 Nov', 'Received from Rahul', '+ Rs.1,23,456.40')), today);
    expect(rows[0].amount).toBe(123456);
    expect(rows[0].type).toBe('income');
  });

  it('skips amounts under one rupee instead of saving ₹0', () => {
    const { rows, errors } = parsePaytm(paytmStatement(payment('1 Nov', 'Cashback', '+ Rs.0.40')), today);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('works out the year from the newest payment and steps back across New Year', () => {
    const { rows } = parsePaytm(
      paytmStatement(
        payment('1 Nov', 'Paid to Zomato', '- Rs.300'),
        payment('2 Jan', 'Paid to Uber', '- Rs.180'),
        payment('28 Dec', 'Paid to PVR', '- Rs.500'),
        payment('5 Oct', 'Paid to Amazon', '- Rs.999'),
      ),
      today,
    );
    expect(dates(rows)).toEqual(['2026-11-01', '2026-01-02', '2025-12-28', '2025-10-05']);
  });

  it('does not jump a year when two neighbouring rows are a day out of order', () => {
    const { rows } = parsePaytm(
      paytmStatement(
        payment('2 Nov', 'Paid to Zomato', '- Rs.300'),
        payment('30 Oct', 'Paid to Uber', '- Rs.180'),
        payment('31 Oct', 'Paid to PVR', '- Rs.500'),
        payment('29 Oct', 'Paid to Amazon', '- Rs.999'),
      ),
      today,
    );
    expect(dates(rows)).toEqual(['2026-11-02', '2026-10-30', '2026-10-31', '2026-10-29']);
  });

  it('puts a newest payment that is later in the year than today in the previous year', () => {
    const { rows } = parsePaytm(paytmStatement(payment('15 Dec', 'Paid to Swiggy', '- Rs.249')), today);
    expect(dates(rows)).toEqual(['2025-12-15']);
  });

  it('handles statements listed oldest first', () => {
    const { rows } = parsePaytm(
      paytmStatement(
        payment('5 Oct', 'Paid to Amazon', '- Rs.999'),
        payment('28 Dec', 'Paid to PVR', '- Rs.500'),
        payment('2 Jan', 'Paid to Uber', '- Rs.180'),
        payment('22 Apr', 'Paid to Zomato', '- Rs.300'),
      ),
      today,
    );
    expect(dates(rows)).toEqual(['2025-10-05', '2025-12-28', '2026-01-02', '2026-04-22']);
  });
});

describe('parseGeneric', () => {
  it('reads a signed Amount column: negative is spending, positive is money in', () => {
    const { rows } = parseGeneric('Date,Description,Amount\n01/10/2026,Zomato order,-450.50\n02/10/2026,Refund from Myntra,1200');
    expect(rows.map((r) => [r.type, r.amount])).toEqual([
      ['expense', 451],
      ['income', 1200],
    ]);
  });

  it('reads Dr/Cr marks on the amount', () => {
    const { rows } = parseGeneric('Date,Narration,Amount\n01/10/2026,ATM withdrawal,"2,000.00 Dr"\n03/10/2026,Interest,"12.00 Cr"');
    expect(rows.map((r) => [r.type, r.amount])).toEqual([
      ['expense', 2000],
      ['income', 12],
    ]);
  });

  it('still reads separate Debit and Credit columns', () => {
    const { rows } = parseGeneric('Date,Narration,Debit,Credit\n01/10/2026,Rent,15000,\n05/10/2026,Salary credit,,85000.75');
    expect(rows.map((r) => [r.type, r.amount])).toEqual([
      ['expense', 15000],
      ['income', 85001],
    ]);
  });

  it('reads YYYY/MM/DD dates as that calendar day whatever the timezone', () => {
    const { rows } = parseGeneric('Date,Description,Debit\n2026/10/01,Rent,15000');
    expect(dates(rows)).toEqual(['2026-10-01']);
    expect(rows[0].date).toBe('2026-10-01T00:00:00.000Z');
  });

  it('skips impossible dates instead of rolling them into the next month', () => {
    const { rows, errors } = parseGeneric('Date,Description,Debit\n31/02/2026,Rent,15000\n01/03/2026,Groceries,800');
    expect(dates(rows)).toEqual(['2026-03-01']);
    expect(errors).toHaveLength(1);
  });
});

describe('parseGeneric date order (review follow-ups)', () => {
  it('reads a file that puts the month first, like 10/31/2026, the same way for every row', () => {
    const { rows, errors } = parseGeneric('Date,Description,Debit\n10/31/2026,Rent,15000\n11/02/2026,Groceries,800');
    expect(errors).toEqual([]);
    expect(dates(rows)).toEqual(['2026-10-31', '2026-11-02']);
  });

  it('keeps the day first, as Indian banks write dates, when every date could be either', () => {
    const { rows } = parseGeneric('Date,Description,Debit\n01/11/2026,Rent,15000\n02/11/2026,Groceries,800');
    expect(dates(rows)).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('stays day first when a file mixes both orders, and skips the rows that do not fit', () => {
    const { rows, errors } = parseGeneric('Date,Description,Debit\n13/10/2026,Rent,15000\n10/14/2026,Groceries,800');
    expect(dates(rows)).toEqual(['2026-10-13']);
    expect(errors).toHaveLength(1);
  });
});

describe('describeImport', () => {
  it('says how many were added and how many were already there', () => {
    expect(describeImport({ inserted: 48, skipped: 2, invalid: 0 })).toBe('Imported 48 transactions. 2 were already in Kharcha.');
  });

  it('says when nothing was new', () => {
    expect(describeImport({ inserted: 0, skipped: 5, invalid: 0 })).toBe('Nothing new to import. 5 were already in Kharcha.');
  });

  it('mentions rows that could not be read', () => {
    expect(describeImport({ inserted: 1, skipped: 0, invalid: 1 })).toBe("Imported 1 transaction. 1 couldn't be read and was skipped.");
  });
});

describe('transactionsToCSV', () => {
  const saved = [
    { id: 'a', date: '2026-10-31T00:00:00.000Z', amount: 450, category: 'Food' as const, type: 'expense' as const, description: 'Swiggy, "biryani"' },
    { id: 'b', date: '2026-10-01T00:00:00.000Z', amount: 85000, category: 'Salary' as const, type: 'income' as const, description: 'October salary' },
    { id: 'c', date: '2026-10-02T00:00:00.000Z', amount: 99, category: 'Other' as const, type: 'expense' as const, description: '=HYPERLINK("http://evil")' },
  ];

  it('quotes descriptions, so commas and quotes stay inside their column', () => {
    const [header, first] = transactionsToCSV(saved).split('\n');
    expect(header).toBe('Date,Description,Category,Type,Amount');
    expect(first).toBe('2026-10-31,"Swiggy, ""biryani""",Food,expense,450');
  });

  it('stops a description from running as a spreadsheet formula', () => {
    expect(transactionsToCSV(saved).split('\n')[3]).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });

  it('can be imported back into Kharcha unchanged', () => {
    const { rows, errors } = parseGeneric(transactionsToCSV(saved));
    expect(errors).toEqual([]);
    expect(rows).toEqual(saved.map(({ date, description, category, type, amount }) => ({ date, description, category, type, amount })));
  });
});

describe('parseGeneric amounts (review follow-ups)', () => {
  it('reads amounts written with Rs., INR or a Dr/Cr prefix', () => {
    const { rows, errors } = parseGeneric(
      'Date,Description,Amount\n01/10/2026,Swiggy,Rs.500\n02/10/2026,Rent,"Rs.15,000"\n03/10/2026,Groceries,"Rs. 1,249.50"\n04/10/2026,ATM,Dr. 2000\n05/10/2026,Interest,INR 12 Cr',
    );
    expect(errors).toEqual([]);
    expect(rows.map((r) => [r.description, r.type, r.amount])).toEqual([
      ['Swiggy', 'expense', 500],
      ['Rent', 'expense', 15000],
      ['Groceries', 'expense', 1250],
      ['ATM', 'expense', 2000],
      ['Interest', 'income', 12],
    ]);
  });

  it('keeps plain purchases as spending when a few rows are negative refunds', () => {
    const { rows } = parseGeneric(
      'Date,Description,Amount\n01/10/2026,Swiggy order,450\n02/10/2026,Amazon purchase,2999\n03/10/2026,Uber trip,180\n04/10/2026,Refund from Myntra,-1200',
    );
    expect(rows.map((r) => [r.description, r.type])).toEqual([
      ['Swiggy order', 'expense'],
      ['Amazon purchase', 'expense'],
      ['Uber trip', 'expense'],
      ['Refund from Myntra', 'income'],
    ]);
  });

  it('treats negatives as spending when most rows are negative', () => {
    const { rows } = parseGeneric(
      'Date,Description,Amount\n01/10/2026,Swiggy,-450\n02/10/2026,Uber,-180\n05/10/2026,Salary credit,85000',
    );
    expect(rows.map((r) => [r.description, r.type])).toEqual([
      ['Swiggy', 'expense'],
      ['Uber', 'expense'],
      ['Salary credit', 'income'],
    ]);
  });
});

describe('parsePaytm years (review follow-ups)', () => {
  it('moves forward again for a row that is out of order just after New Year', () => {
    const { rows } = parsePaytm(
      paytmStatement(
        payment('5 Jan', 'A', '- Rs.10'),
        payment('1 Jan', 'B', '- Rs.10'),
        payment('31 Dec', 'C', '- Rs.10'),
        payment('1 Jan', 'D', '- Rs.10'),
        payment('30 Dec', 'E', '- Rs.10'),
        payment('20 Dec', 'F', '- Rs.10'),
      ),
      new Date('2026-01-10T10:00:00+05:30'),
    );
    expect(dates(rows)).toEqual(['2026-01-05', '2026-01-01', '2025-12-31', '2026-01-01', '2025-12-30', '2025-12-20']);
  });

  it('never dates a payment after today', () => {
    const { rows } = parsePaytm(
      paytmStatement(payment('10 Jun', 'A', '- Rs.10'), payment('1 Dec', 'B', '- Rs.10'), payment('20 Nov', 'C', '- Rs.10')),
      new Date('2026-06-12T10:00:00+05:30'),
    );
    expect(dates(rows)).toEqual(['2026-06-10', '2025-12-01', '2025-11-20']);
  });

  it("uses India's date, so a device on another timezone gets the same years", () => {
    const originalTZ = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      const { rows } = parsePaytm(paytmStatement(payment('2 Nov', 'A', '- Rs.10')), new Date('2026-11-02T10:00:00+05:30'));
      expect(dates(rows)).toEqual(['2026-11-02']);
    } finally {
      process.env.TZ = originalTZ;
    }
  });
});
