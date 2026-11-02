import { describe, expect, it } from 'vitest';
import { toWholeRupees } from './money';

describe('toWholeRupees', () => {
  it('rounds paise to the nearest rupee', () => {
    expect(toWholeRupees('249.50')).toBe(250);
    expect(toWholeRupees('249.49')).toBe(249);
    expect(toWholeRupees(1200)).toBe(1200);
  });

  it('rejects amounts that round to less than ₹1', () => {
    expect(toWholeRupees('0.40')).toBeNull();
    expect(toWholeRupees('0')).toBeNull();
    expect(toWholeRupees('-50')).toBeNull();
  });

  it('rejects empty or unreadable input', () => {
    expect(toWholeRupees('')).toBeNull();
    expect(toWholeRupees('abc')).toBeNull();
    expect(toWholeRupees('1,200')).toBeNull();
  });
});
