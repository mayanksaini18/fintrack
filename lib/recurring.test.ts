import { afterEach, describe, expect, it } from 'vitest';
import { addPeriods, firstOccurrenceOnOrAfter, planOccurrences } from './recurring';

const d = (iso: string) => new Date(iso);
const isoList = (dates: Date[]) => dates.map((x) => x.toISOString().slice(0, 10));

describe('addPeriods', () => {
  it('keeps a month-end schedule on the month end instead of drifting', () => {
    const start = d('2026-01-31T00:00:00.000Z');
    expect(addPeriods(start, 'monthly', 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(addPeriods(start, 'monthly', 2).toISOString()).toBe('2026-03-31T00:00:00.000Z');
    expect(addPeriods(start, 'monthly', 3).toISOString()).toBe('2026-04-30T00:00:00.000Z');
    expect(addPeriods(start, 'monthly', 13).toISOString()).toBe('2027-02-28T00:00:00.000Z');
  });

  it('uses Feb 29 in leap years', () => {
    expect(addPeriods(d('2028-01-31T00:00:00.000Z'), 'monthly', 1).toISOString()).toBe('2028-02-29T00:00:00.000Z');
    expect(addPeriods(d('2028-02-29T00:00:00.000Z'), 'yearly', 1).toISOString()).toBe('2029-02-28T00:00:00.000Z');
    expect(addPeriods(d('2028-02-29T00:00:00.000Z'), 'yearly', 4).toISOString()).toBe('2032-02-29T00:00:00.000Z');
  });

  it('adds whole weeks', () => {
    expect(addPeriods(d('2026-10-01T00:00:00.000Z'), 'weekly', 2).toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  describe('outside UTC', () => {
    const originalTZ = process.env.TZ;
    afterEach(() => {
      process.env.TZ = originalTZ;
    });

    it('does month maths in UTC whatever the server timezone', () => {
      process.env.TZ = 'America/New_York';
      expect(addPeriods(d('2026-03-01T00:00:00.000Z'), 'monthly', 1).toISOString()).toBe('2026-04-01T00:00:00.000Z');
    });
  });
});

describe('planOccurrences', () => {
  const now = d('2026-11-02T04:00:00.000Z');

  it('skips the April–October backlog and moves to the next future date', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-04-25T00:00:00.000Z'), nextDueDate: d('2026-04-25T00:00:00.000Z'), createdAt: d('2026-04-25T00:00:00.000Z') },
      now,
    );
    expect(plan.create).toEqual([]);
    expect(plan.skipped).toBe(7); // Apr 25 … Oct 25
    expect(plan.nextDueDate.toISOString()).toBe('2026-11-25T00:00:00.000Z');
  });

  it('skips late-October dates even though they are inside the 7-day window', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-10-28T00:00:00.000Z'), nextDueDate: d('2026-10-28T00:00:00.000Z'), createdAt: d('2026-10-28T00:00:00.000Z') },
      now,
    );
    expect(plan.create).toEqual([]);
    expect(plan.skipped).toBe(1);
    expect(plan.nextDueDate.toISOString()).toBe('2026-11-28T00:00:00.000Z');
  });

  it('creates a date that is due now', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-11-01T00:00:00.000Z'), nextDueDate: d('2026-11-01T00:00:00.000Z'), createdAt: d('2026-11-01T00:00:00.000Z') },
      now,
    );
    expect(isoList(plan.create)).toEqual(['2026-11-01']);
    expect(plan.skipped).toBe(0);
    expect(plan.nextDueDate.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it('fills in today and the 7 days before it after a missed run', () => {
    const plan = planOccurrences(
      { frequency: 'weekly', startDate: d('2026-12-13T00:00:00.000Z'), nextDueDate: d('2026-12-13T00:00:00.000Z'), createdAt: d('2026-12-13T00:00:00.000Z') },
      d('2026-12-20T04:00:00.000Z'),
    );
    expect(isoList(plan.create)).toEqual(['2026-12-13', '2026-12-20']);
    expect(plan.nextDueDate.toISOString()).toBe('2026-12-27T00:00:00.000Z');
  });

  it('skips dates older than the 7-day window', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-12-05T00:00:00.000Z'), nextDueDate: d('2026-12-05T00:00:00.000Z'), createdAt: d('2026-12-05T00:00:00.000Z') },
      d('2026-12-20T04:00:00.000Z'),
    );
    expect(plan.create).toEqual([]);
    expect(plan.skipped).toBe(1);
    expect(plan.nextDueDate.toISOString()).toBe('2027-01-05T00:00:00.000Z');
  });

  it('creates a date exactly 7 days back and skips one 8 days back', () => {
    const cron = d('2026-12-20T01:00:00.000Z');
    const sevenBack = d('2026-12-13T00:00:00.000Z');
    const eightBack = d('2026-12-12T00:00:00.000Z');
    expect(isoList(planOccurrences({ frequency: 'monthly', startDate: sevenBack, nextDueDate: sevenBack, createdAt: sevenBack }, cron).create)).toEqual(['2026-12-13']);
    expect(planOccurrences({ frequency: 'monthly', startDate: eightBack, nextDueDate: eightBack, createdAt: eightBack }, cron).skipped).toBe(1);
  });

  it('fills in the past dates a new item asks for with its start date', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-11-15T00:00:00.000Z'), nextDueDate: d('2026-11-15T00:00:00.000Z'), createdAt: d('2026-12-12T10:00:00.000Z') },
      d('2026-12-13T01:00:00.000Z'),
    );
    expect(isoList(plan.create)).toEqual(['2026-11-15']);
    expect(plan.nextDueDate.toISOString()).toBe('2026-12-15T00:00:00.000Z');
  });

  it('still skips dates before 1 Nov 2026 for a new item', () => {
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-09-15T00:00:00.000Z'), nextDueDate: d('2026-09-15T00:00:00.000Z'), createdAt: d('2026-12-12T10:00:00.000Z') },
      d('2026-12-13T01:00:00.000Z'),
    );
    expect(isoList(plan.create)).toEqual(['2026-11-15']);
    expect(plan.skipped).toBe(2);
  });

  it('does nothing when the next date is still in the future', () => {
    const next = d('2026-11-20T00:00:00.000Z');
    const plan = planOccurrences({ frequency: 'monthly', startDate: next, nextDueDate: next, createdAt: next }, now);
    expect(plan.create).toEqual([]);
    expect(plan.skipped).toBe(0);
    expect(plan.nextDueDate.toISOString()).toBe(next.toISOString());
  });

  it('gets back onto the start-date schedule when the stored date drifted', () => {
    // The old setMonth() maths turned Jan 31 + 1 month into Mar 3.
    const plan = planOccurrences(
      { frequency: 'monthly', startDate: d('2026-01-31T00:00:00.000Z'), nextDueDate: d('2026-03-03T00:00:00.000Z'), createdAt: d('2026-01-31T00:00:00.000Z') },
      now,
    );
    expect(plan.create).toEqual([]);
    expect(plan.nextDueDate.toISOString()).toBe('2026-11-30T00:00:00.000Z');
  });
});

describe('firstOccurrenceOnOrAfter', () => {
  const schedule = { frequency: 'monthly' as const, startDate: d('2026-01-31T00:00:00.000Z') };

  it('finds the next date on the schedule', () => {
    expect(firstOccurrenceOnOrAfter(schedule, d('2026-11-02T00:00:00.000Z')).toISOString()).toBe('2026-11-30T00:00:00.000Z');
  });

  it('counts a date that falls exactly on the boundary', () => {
    expect(firstOccurrenceOnOrAfter(schedule, d('2026-11-30T00:00:00.000Z')).toISOString()).toBe('2026-11-30T00:00:00.000Z');
  });

  it('returns the start date when the schedule has not started yet', () => {
    const later = { frequency: 'weekly' as const, startDate: d('2027-01-15T00:00:00.000Z') };
    expect(firstOccurrenceOnOrAfter(later, d('2026-11-02T00:00:00.000Z')).toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });
});
