// The one list of categories. The database enum, validation, imports and every picker use it.
// Adding one here also needs a database migration for the `category` enum.
export const CATEGORIES = [
  'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment',
  'Shopping', 'Healthcare', 'Utilities', 'Rent', 'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
