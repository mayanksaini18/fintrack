import { pgTable, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

export const categoryEnum = pgEnum('category', [
  'Salary',
  'Freelance',
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Utilities',
  'Rent',
  'Other',
]);

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  amount: integer('amount').notNull(),
  category: categoryEnum('category').notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
