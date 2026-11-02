import { describe, expect, it } from 'vitest';
import { recurringSchema, transactionSchema } from './validation';

const recurring = { amount: 649, category: 'Entertainment', type: 'expense', description: 'Netflix', frequency: 'monthly' };
const transaction = { amount: 450, category: 'Food', type: 'expense', description: 'Swiggy' };

describe('date fields', () => {
  it('accept real dates', () => {
    expect(recurringSchema.safeParse({ ...recurring, startDate: '2026-11-02T00:00:00.000Z' }).success).toBe(true);
    expect(transactionSchema.safeParse({ ...transaction, date: '2026-11-02' }).success).toBe(true);
  });

  it('reject a year typo that the database would store but could not read back', () => {
    expect(recurringSchema.safeParse({ ...recurring, startDate: '0026-11-02T00:00:00.000Z' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transaction, date: '0026-11-02T00:00:00.000Z' }).success).toBe(false);
  });

  it('reject text that is not a date, and far-off years', () => {
    expect(recurringSchema.safeParse({ ...recurring, startDate: 'next monday' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transaction, date: '2201-01-01' }).success).toBe(false);
  });
});
