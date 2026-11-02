import type { Transaction } from '@/types';

export function toggleOne(selected: Set<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Ticks every row on the page, or unticks them if all were ticked, leaving other pages' rows alone */
export function togglePage(selected: Set<string>, pageIds: string[]): Set<string> {
  const next = new Set(selected);
  const allTicked = pageIds.length > 0 && pageIds.every((id) => next.has(id));
  for (const id of pageIds) {
    if (allTicked) next.delete(id);
    else next.add(id);
  }
  return next;
}

/** The ticked rows the current search and filters still show; only these are counted and deleted */
export function selectedInView(visible: Transaction[], selected: Set<string>): string[] {
  return visible.filter((t) => selected.has(t.id)).map((t) => t.id);
}
