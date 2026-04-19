import { pgTable, text, integer, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

export const frequencyEnum = pgEnum('frequency', ['weekly', 'monthly', 'yearly']);

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
  userId: text('user_id').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  amount: integer('amount').notNull(),
  category: categoryEnum('category').notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recurringTransactions = pgTable('recurring_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  amount: integer('amount').notNull(),
  category: categoryEnum('category').notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  nextDueDate: timestamp('next_due_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  category: categoryEnum('category').notNull(),
  monthlyLimit: integer('monthly_limit').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
