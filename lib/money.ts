/** Kharcha stores whole rupees. Rounds to the nearest rupee, or returns null if that isn't at least ₹1. */
export function toWholeRupees(input: string | number): number | null {
  if (typeof input === 'string' && input.trim() === '') return null;
  const rupees = Math.round(Number(input));
  return Number.isFinite(rupees) && rupees >= 1 ? rupees : null;
}
