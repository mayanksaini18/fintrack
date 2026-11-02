import { describe, expect, it } from 'vitest';
import { getDemoTransactions } from './mock-data';

const monthOf = (iso: string) => iso.slice(0, 7);

describe('getDemoTransactions', () => {
  it('moves the demo forward so it ends in the current month', () => {
    const demo = getDemoTransactions(new Date('2026-11-20T12:00:00.000Z'));
    const months = [...new Set(demo.map((t) => monthOf(t.date)))].sort();
    expect(months).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  });

  it('leaves out anything that would land after now', () => {
    const now = new Date('2026-11-02T05:00:00.000Z');
    const demo = getDemoTransactions(now);
    expect(demo.length).toBeGreaterThan(0);
    expect(demo.every((t) => Date.parse(t.date) <= now.getTime())).toBe(true);
    expect(demo.some((t) => monthOf(t.date) === '2026-11')).toBe(true);
  });

  it('renames the month in descriptions to match the new date', () => {
    const demo = getDemoTransactions(new Date('2026-11-20T12:00:00.000Z'));
    const salaries = demo.filter((t) => t.description.startsWith('Salary credit')).map((t) => [monthOf(t.date), t.description]);
    expect(salaries).toContainEqual(['2026-06', 'Salary credit – June']);
    expect(salaries).toContainEqual(['2026-11', 'Salary credit – November']);
  });

  it('keeps the same entries and amounts, only moving dates', () => {
    const later = getDemoTransactions(new Date('2027-03-31T23:00:00.000Z'));
    const earlier = getDemoTransactions(new Date('2026-11-30T23:00:00.000Z'));
    expect(later.map((t) => [t.id, t.amount, t.type, t.category])).toEqual(earlier.map((t) => [t.id, t.amount, t.type, t.category]));
  });
});
