import { z } from 'zod';

const CATEGORIES = ['Salary','Freelance','Food','Transport','Entertainment','Shopping','Healthcare','Utilities','Rent','Other'] as const;
const TYPES = ['income','expense'] as const;
const FREQUENCIES = ['weekly','monthly','yearly'] as const;

export const transactionSchema = z.object({
  date: z.string().min(1),
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
  startDate: z.string().min(1),
});

export const recurringUpdateSchema = recurringSchema.partial();
