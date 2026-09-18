import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { sourceTransactionSchema, type TransactionPage } from '@loopr/contracts';
import { collections, createIndexes } from '../../apps/api/src/db/database.js';
import { buildApp } from '../../apps/api/src/app.js';
import { hashPassword } from '../../apps/api/src/modules/auth/password.js';

const client = new MongoClient(process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27018', {
  serverSelectionTimeoutMS: 3000,
});
const databaseName = `loopr_test_${randomUUID().replaceAll('-', '')}`;
const db = collections(client.db(databaseName));
const password = 'Integration-test-only-123';
const headers = { 'x-requested-with': 'loopr' };
let app: Awaited<ReturnType<typeof buildApp>>;
let cookie: string;

beforeAll(async () => {
  await client.connect();
  await createIndexes(db);
  const source: unknown[] = JSON.parse(
    readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
  );
  await db.transactions.insertMany(
    source.map((value) => {
      const row = sourceTransactionSchema.parse(value);
      return {
        id: row.id,
        date: new Date(row.date),
        amountMinor: Math.round(row.amount * 100),
        category: row.category,
        status: row.status,
        userId: row.user_id,
      };
    }),
  );
  await db.users.insertOne({
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test Analyst',
    passwordHash: await hashPassword(password),
  });
  app = await buildApp(
    {
      NODE_ENV: 'test',
      PORT: 3000,
      APP_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'unused-in-injected-app',
      JWT_SECRET: randomUUID(),
    },
    db,
  );
}, 15000);

afterAll(async () => {
  if (app) await app.close();
  // Only the unique database created by this test run is ever removed.
  await client.db(databaseName).dropDatabase();
  await client.close();
});

describe('authenticated API against real MongoDB', () => {
  it('checks readiness and protects transaction data', async () => {
    expect((await app.inject('/api/health/ready')).statusCode).toBe(200);
    expect((await app.inject('/api/transactions')).statusCode).toBe(401);
  });
  it('rejects cross-origin and missing-header login attempts', async () => {
    const payload = { email: 'test@example.com', password };
    expect((await app.inject({ method: 'POST', url: '/api/auth/login', payload })).statusCode).toBe(
      403,
    );
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload,
          headers: { ...headers, origin: 'https://other.example' },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('rejects invalid credentials and issues a protected cookie for valid credentials', async () => {
    const wrong = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers,
      payload: { email: 'test@example.com', password: 'wrong' },
    });
    expect(wrong.statusCode).toBe(401);
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers,
      payload: { email: 'test@example.com', password },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().user).not.toHaveProperty('passwordHash');
    const setCookie = response.headers['set-cookie'] as string;
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    cookie = setCookie.split(';')[0]!;
  });
  it('returns correct paging without leaking database IDs', async () => {
    const first = await app.inject({
      url: '/api/transactions?page=1&pageSize=20',
      headers: { cookie },
    });
    const second = await app.inject({
      url: '/api/transactions?page=2&pageSize=20',
      headers: { cookie },
    });
    expect(first.statusCode).toBe(200);
    const a = first.json<TransactionPage>();
    const b = second.json<TransactionPage>();
    expect(a.total).toBe(300);
    expect(a.items).toHaveLength(20);
    expect(a.items[0]).not.toHaveProperty('_id');
    expect(a.items.every((item) => Number.isSafeInteger(item.amountMinor))).toBe(true);
    expect(new Set([...a.items, ...b.items].map((item) => item.id)).size).toBe(40);
    expect(
      (await app.inject({ url: '/api/transactions?pageSize=1000', headers: { cookie } }))
        .statusCode,
    ).toBe(400);
  });
  it('rejects expired database sessions even before TTL cleanup', async () => {
    const token = app.jwt.sign({ sub: 'test-user', jti: 'expired-session' });
    await db.sessions.insertOne({
      id: 'expired-session',
      userId: 'test-user',
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(
      (await app.inject({ url: '/api/auth/me', headers: { cookie: `session=${token}` } }))
        .statusCode,
    ).toBe(401);
  });
  it('computes exact paid totals and pending counts from the whole dataset', async () => {
    const response = await app.inject({ url: '/api/analytics', headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      total: 300,
      paidRevenueMinor: 19530200,
      paidExpenseMinor: 14580325,
      netCashFlowMinor: 4949875,
      pendingCount: 114,
    });
    expect(response.json().monthly).toHaveLength(12);
  });
  it('keeps combined filters, analytics and full CSV exports consistent', async () => {
    const query = {
      category: 'Revenue',
      status: 'Paid',
      userId: 'user_001',
      dateFrom: '2024-01-01',
      dateTo: '2024-06-30',
      amountMin: '1000',
      sortBy: 'amountMinor',
      sortOrder: 'asc',
      pageSize: '1',
    };
    const source: unknown[] = JSON.parse(
      readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
    );
    const expected = source
      .map((row) => sourceTransactionSchema.parse(row))
      .filter(
        (row) =>
          row.category === 'Revenue' &&
          row.status === 'Paid' &&
          row.user_id === 'user_001' &&
          row.date >= '2024-01-01' &&
          row.date < '2024-07-01' &&
          row.amount >= 1000,
      );
    expect(expected.length).toBeGreaterThan(1);
    const qs = new URLSearchParams(query);
    const list = await app.inject({ url: `/api/transactions?${qs}`, headers: { cookie } });
    const analytics = await app.inject({ url: `/api/analytics?${qs}`, headers: { cookie } });
    expect(list.json().total).toBe(expected.length);
    expect(list.json().items).toHaveLength(1);
    expect(analytics.json().paidRevenueMinor).toBe(
      expected.reduce((sum, row) => sum + Math.round(row.amount * 100), 0),
    );
    const exported = await app.inject({
      method: 'POST',
      url: '/api/exports',
      headers: { ...headers, cookie },
      payload: { query, columns: ['status', 'id', 'amount'] },
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers['content-type']).toContain('text/csv');
    const lines = exported.body
      .replace(/^\uFEFF/, '')
      .trim()
      .split('\r\n');
    expect(lines[0]).toBe('Status,Transaction ID,Amount (USD)');
    expect(lines).toHaveLength(expected.length + 1);
    expect(lines.slice(1).map((line) => Number(line.split(',')[2]))).toEqual(
      expected.map((row) => row.amount).sort((a, b) => a - b),
    );
  });
  it('handles literal search, empty results and invalid filter ranges', async () => {
    const none = await app.inject({
      url: `/api/transactions?search=${encodeURIComponent('.*')}`,
      headers: { cookie },
    });
    expect(none.json().total).toBe(0);
    const invalid = await app.inject({
      url: '/api/transactions?dateFrom=2024-06-01&dateTo=2024-01-01',
      headers: { cookie },
    });
    expect(invalid.statusCode).toBe(400);
    const pending = await app.inject({ url: '/api/analytics?status=Pending', headers: { cookie } });
    expect(pending.json()).toMatchObject({
      total: 114,
      paidRevenueMinor: 0,
      paidExpenseMinor: 0,
      pendingCount: 114,
    });
  });
  it('revokes the session so the original token cannot be replayed after logout', async () => {
    expect((await app.inject({ url: '/api/auth/me', headers: { cookie } })).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/logout',
          headers: { ...headers, cookie },
        })
      ).statusCode,
    ).toBe(204);
    expect((await app.inject({ url: '/api/auth/me', headers: { cookie } })).statusCode).toBe(401);
  });
});
