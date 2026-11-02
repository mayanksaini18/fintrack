import { z } from 'zod';
import { CATEGORIES } from '@/lib/categories';

const TYPES = ['income','expense'] as const;
const FREQUENCIES = ['weekly','monthly','yearly'] as const;

// A real date between 2000 and 2100. Postgres accepts a typo like year 0026, but it reads
// back as an invalid JavaScript date and breaks every list and the daily cron.
export function isUsableDate(date: Date): boolean {
  const year = date.getUTCFullYear();
  return !Number.isNaN(date.getTime()) && year >= 2000 && year <= 2100;
}

/** ISO string, or null for a stored date that can't be read back */
export function isoOrNull(date: Date): string | null {
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// ₹100 crore: far above any personal transaction, and safely inside the database's integer column
export const MAX_AMOUNT = 1_000_000_000;
const amount = z.number().positive().int().max(MAX_AMOUNT);

// Postgres refuses NUL characters in text, which would fail the whole save
const description = z
  .string()
  .transform((s) => s.replace(/\0/g, ''))
  .pipe(z.string().min(1).max(200));

const dateString = z
  .string()
  .min(1)
  .refine((s) => isUsableDate(new Date(s)), 'Enter a real date between 2000 and 2100');

export const transactionSchema = z.object({
  date: dateString,
  amount,
  category: z.enum(CATEGORIES),
  type: z.enum(TYPES),
  description,
});

export const transactionUpdateSchema = transactionSchema.partial();

export const budgetSchema = z.object({
  category: z.enum(CATEGORIES),
  monthlyLimit: amount,
});

export const recurringSchema = z.object({
  amount,
  category: z.enum(CATEGORIES),
  type: z.enum(TYPES),
  description,
  frequency: z.enum(FREQUENCIES),
  startDate: dateString,
});

export const recurringUpdateSchema = recurringSchema.partial();
