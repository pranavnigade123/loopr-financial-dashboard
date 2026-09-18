import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sourceTransactionSchema, transactionQuerySchema } from '@loopr/contracts';
import { hashPassword, verifyPassword } from '../../apps/api/src/modules/auth/password.js';

const source: unknown[] = JSON.parse(
  readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
);
const rows = source.map((row) => sourceTransactionSchema.parse(row));

describe('assignment dataset and monetary contract', () => {
  it('validates all 300 records with unique IDs', () => {
    expect(rows).toHaveLength(300);
    expect(new Set(rows.map((row) => row.id)).size).toBe(300);
  });
  it('preserves independently verified paid revenue and expenses in integer cents', () => {
    const paid = rows.filter((row) => row.status === 'Paid');
    const total = (category: string) =>
      paid
        .filter((row) => row.category === category)
        .reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
    expect(total('Revenue')).toBe(19530200);
    expect(total('Expense')).toBe(14580325);
    expect(total('Revenue') - total('Expense')).toBe(4949875);
  });
  it('rejects malformed financial data and unsupported precision', () => {
    expect(sourceTransactionSchema.safeParse({ ...rows[0], amount: 0.001 }).success).toBe(false);
    expect(sourceTransactionSchema.safeParse({ ...rows[0], amount: -2 }).success).toBe(false);
    expect(sourceTransactionSchema.safeParse({ ...rows[0], date: 'invalid' }).success).toBe(false);
  });
  it('bounds pagination and rejects unexpected query operators', () => {
    expect(transactionQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    expect(transactionQuerySchema.safeParse({ pageSize: '1000000' }).success).toBe(false);
    expect(transactionQuerySchema.safeParse({ $where: 'anything' }).success).toBe(false);
  });
});

describe('password hashing', () => {
  it('uses independent salts and verifies only the correct password', async () => {
    const first = await hashPassword('test-password-only');
    const second = await hashPassword('test-password-only');
    expect(first).not.toBe(second);
    expect(await verifyPassword('test-password-only', first)).toBe(true);
    expect(await verifyPassword('incorrect-password', first)).toBe(false);
    expect(await verifyPassword('anything', 'malformed')).toBe(false);
  });
});
