import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { transactions } from './schema';
import { mockTransactions } from '../mock-data';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Seeding database with mock transactions...');

  const userId = process.env.SEED_USER_ID || 'seed-user';

  const values = mockTransactions.map((t) => ({
    id: t.id,
    userId,
    date: new Date(t.date),
    amount: t.amount,
    category: t.category as typeof transactions.category.enumValues[number],
    type: t.type as 'income' | 'expense',
    description: t.description,
  }));

  await db.insert(transactions).values(values);

  console.log(`Inserted ${values.length} transactions.`);
}

seed().catch(console.error);
