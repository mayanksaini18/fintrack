import { z } from 'zod';

const CATEGORIES = ['Salary','Freelance','Food','Transport','Entertainment','Shopping','Healthcare','Utilities','Rent','Other'] as const;
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

const dateString = z
  .string()
  .min(1)
  .refine((s) => isUsableDate(new Date(s)), 'Enter a real date between 2000 and 2100');

export const transactionSchema = z.object({
  date: dateString,
  amount: z.number().positive().int(),
  category: z.enum(CATEGORIES),
  type: z.enum(TYPES),
  description: z.string().min(1).max(200),
});

export const transactionUpdateSchema = transactionSchema.partial();

export const budgetSchema = z.object({
  category: z.enum(CATEGORIES),
  monthlyLimit: z.number().positive().int(),
});

export const recurringSchema = z.object({
  amount: z.number().positive().int(),
  category: z.enum(CATEGORIES),
  type: z.enum(TYPES),
  description: z.string().min(1).max(200),
  frequency: z.enum(FREQUENCIES),
  startDate: dateString,
});

export const recurringUpdateSchema = recurringSchema.partial();
