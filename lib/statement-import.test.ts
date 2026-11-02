import { describe, expect, it } from 'vitest';
import { parseGeneric, parsePaytm } from './statement-import';

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
