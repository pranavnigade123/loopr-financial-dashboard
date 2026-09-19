import { afterAll, beforeAll, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../../apps/api/src/app.js';
import { collections, createIndexes } from '../../apps/api/src/db/database.js';
import { verifyPassword } from '../../apps/api/src/modules/auth/password.js';

const client = new MongoClient(process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27018', {
  serverSelectionTimeoutMS: 3000,
});
const dbName = `loopr_test_${randomUUID().replaceAll('-', '')}`;
const db = collections(client.db(dbName));
let app: Awaited<ReturnType<typeof buildApp>>;
const headers = { 'x-requested-with': 'loopr' };
const payload = {
  name: 'New Analyst',
  email: 'new@example.com',
  password: 'Registration-test-only-2026',
};
beforeAll(async () => {
  await client.connect();
  await createIndexes(db);
  app = await buildApp(
    {
      NODE_ENV: 'test',
      PORT: 3000,
      APP_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'injected',
      JWT_SECRET: randomUUID(),
    },
    db,
  );
});
afterAll(async () => {
  if (app) await app.close();
  await client.db(dbName).dropDatabase();
  await client.close();
});

it('rejects weak passwords and forbidden origins without creating accounts', async () => {
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers,
        payload: { ...payload, password: 'short' },
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload,
        headers: { ...headers, origin: 'https://other.example' },
      })
    ).statusCode,
  ).toBe(403);
  expect(await db.users.countDocuments()).toBe(0);
});

it('normalizes identity, hashes passwords, rejects duplicates and supports login/logout', async () => {
  const registered = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers,
    payload: { ...payload, email: ' NEW@EXAMPLE.COM ', name: ' New Analyst ' },
  });
  expect(registered.statusCode).toBe(201);
  expect(registered.json().user).toEqual({
    id: expect.any(String),
    email: payload.email,
    name: payload.name,
  });
  expect(registered.headers['set-cookie']).toBeUndefined();
  const saved = await db.users.findOne({ email: payload.email });
  expect(saved?.passwordHash).not.toBe(payload.password);
  expect(await verifyPassword(payload.password, saved!.passwordHash)).toBe(true);
  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers,
    payload,
  });
  expect(duplicate.statusCode).toBe(409);
  expect(await db.users.countDocuments()).toBe(1);
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers,
    payload: { email: payload.email, password: payload.password },
  });
  expect(login.statusCode).toBe(200);
  const cookie = (login.headers['set-cookie'] as string).split(';')[0]!;
  expect((await app.inject({ url: '/api/auth/me', headers: { cookie } })).json().user.name).toBe(
    payload.name,
  );
  expect(
    (await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...headers, cookie } }))
      .statusCode,
  ).toBe(204);
  expect((await app.inject({ url: '/api/auth/me', headers: { cookie } })).statusCode).toBe(401);
});

it('enforces unique email during simultaneous registrations', async () => {
  const attempts = await Promise.all(
    [1, 2].map(() =>
      app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers,
        payload: { ...payload, email: 'race@example.com' },
      }),
    ),
  );
  expect(attempts.map((result) => result.statusCode).sort()).toEqual([201, 409]);
  expect(await db.users.countDocuments({ email: 'race@example.com' })).toBe(1);
});
