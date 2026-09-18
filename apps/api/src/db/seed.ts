import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { sourceTransactionSchema } from '@loopr/contracts';
import { readConfig } from '../config.js';
import { connectDatabase, createIndexes } from './database.js';
import { hashPassword } from '../modules/auth/password.js';

async function seed() {
  const config = readConfig();
  const email = z.email().parse(process.env.DEMO_EMAIL).toLowerCase();
  const password = z.string().min(12).max(256).parse(process.env.DEMO_PASSWORD);
  const source: unknown = JSON.parse(
    await readFile(new URL('../../../../data/transactions.json', import.meta.url), 'utf8'),
  );
  const rows = z.array(sourceTransactionSchema).min(1).parse(source);
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new Error('Duplicate source transaction IDs.');
  const { client, db } = await connectDatabase(config.MONGODB_URI);
  try {
    await createIndexes(db);
    await db.transactions.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { id: row.id },
          update: {
            $set: {
              id: row.id,
              date: new Date(row.date),
              amountMinor: Math.round(row.amount * 100),
              category: row.category,
              status: row.status,
              userId: row.user_id,
            },
          },
          upsert: true,
        },
      })),
    );
    await db.users.updateOne(
      { email },
      {
        $setOnInsert: {
          id: randomUUID(),
          email,
          name: 'Demo Analyst',
          passwordHash: await hashPassword(password),
        },
      },
      { upsert: true },
    );
    console.info(
      `Seed complete: ${rows.length} transactions upserted. Demo user created if absent. Existing credentials were not changed.`,
    );
  } finally {
    await client.close();
  }
}

seed().catch(() => {
  console.error('Seed failed. Check the dataset, environment values, and MongoDB connection.');
  process.exitCode = 1;
});
