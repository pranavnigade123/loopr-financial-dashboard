import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../../apps/api/dist/app.js';
import { collections, createIndexes } from '../../apps/api/dist/db/database.js';
import { hashPassword } from '../../apps/api/dist/modules/auth/password.js';

// Browser tests never load .env or use the Atlas database.
const client = new MongoClient('mongodb://127.0.0.1:27018', { serverSelectionTimeoutMS: 5000 });
const name = `loopr_browser_${randomUUID().replaceAll('-', '')}`;
await client.connect();
const db = collections(client.db(name));
await createIndexes(db);
const rows = JSON.parse(
  await readFile(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
);
await db.transactions.insertMany(
  rows.map((row) => ({
    id: row.id,
    date: new Date(row.date),
    amountMinor: Math.round(row.amount * 100),
    category: row.category,
    status: row.status,
    userId: row.user_id,
  })),
);
await db.users.insertOne({
  id: 'browser-analyst',
  email: 'browser@example.com',
  name: 'Browser Analyst',
  passwordHash: await hashPassword('Browser-test-only-2026'),
});
const app = await buildApp(
  {
    NODE_ENV: 'test',
    PORT: 3003,
    APP_ORIGIN: 'http://localhost:3003',
    MONGODB_URI: 'injected',
    JWT_SECRET: randomUUID(),
  },
  db,
);
app.addHook('onClose', async () => {
  await client.db(name).dropDatabase();
  await client.close();
});
process.once('SIGINT', () => void app.close());
process.once('SIGTERM', () => void app.close());
await app.listen({ port: 3003, host: '127.0.0.1' });
