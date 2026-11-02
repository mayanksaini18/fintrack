import { afterEach, describe, expect, it } from 'vitest';
import { dateInputValue } from './utils';

describe('dateInputValue', () => {
  const originalTZ = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it("uses the user's own calendar date, not UTC's", () => {
    // Tue 10 Nov 01:00 in India is still 9 Nov in UTC
    process.env.TZ = 'Asia/Kolkata';
    expect(dateInputValue(new Date('2026-11-09T19:30:00.000Z'))).toBe('2026-11-10');
  });
});
