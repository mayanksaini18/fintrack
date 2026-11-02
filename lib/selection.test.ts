import { describe, expect, it } from 'vitest';
import { selectedInView, toggleOne, togglePage } from './selection';
import type { Transaction } from '@/types';

const tx = (id: string, description = id): Transaction => ({
  id,
  date: '2026-10-01T00:00:00.000Z',
  amount: 100,
  category: 'Food',
  type: 'expense',
  description,
});

describe('row selection', () => {
  it('select-all on page 2 keeps the rows already ticked on page 1', () => {
    const ticked = togglePage(new Set(['p1-a', 'p1-b']), ['p2-a', 'p2-b']);
    expect([...ticked].sort()).toEqual(['p1-a', 'p1-b', 'p2-a', 'p2-b']);
  });

  it('select-all again unticks only that page', () => {
    const ticked = togglePage(new Set(['p1-a', 'p2-a', 'p2-b']), ['p2-a', 'p2-b']);
    expect([...ticked]).toEqual(['p1-a']);
  });

  it('ticks and unticks one row', () => {
    expect([...toggleOne(new Set(['a']), 'b')].sort()).toEqual(['a', 'b']);
    expect([...toggleOne(new Set(['a', 'b']), 'a')]).toEqual(['b']);
  });

  it('only counts ticked rows the current search and filters still show', () => {
    const visible = [tx('a'), tx('c')];
    expect(selectedInView(visible, new Set(['a', 'b', 'c']))).toEqual(['a', 'c']);
  });
});
