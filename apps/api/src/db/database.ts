import { MongoClient, type Db, type Collection } from 'mongodb';
import type { Transaction } from '@loopr/contracts';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}
export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
}
export type TransactionRecord = Omit<Transaction, 'date'> & { date: Date };

export interface Database {
  transactions: Collection<TransactionRecord>;
  users: Collection<UserRecord>;
  sessions: Collection<SessionRecord>;
  ping(): Promise<void>;
}

export function collections(db: Db): Database {
  return {
    transactions: db.collection<TransactionRecord>('transactions'),
    users: db.collection<UserRecord>('users'),
    sessions: db.collection<SessionRecord>('sessions'),
    async ping() {
      await db.command({ ping: 1 });
    },
  };
}

export async function connectDatabase(uri: string) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
  await client.connect();
  return { client, db: collections(client.db()) };
}

export async function createIndexes(db: Database) {
  await Promise.all([
    db.transactions.createIndex({ id: 1 }, { unique: true }),
    db.transactions.createIndex({ date: -1, id: -1 }),
    db.users.createIndex({ email: 1 }, { unique: true }),
    db.users.createIndex({ id: 1 }, { unique: true }),
    db.sessions.createIndex({ id: 1 }, { unique: true }),
    db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
