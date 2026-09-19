import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { loginSchema, registerSchema } from '@loopr/contracts';
import { MongoServerError } from 'mongodb';
import type { Config } from './config.js';
import type { Database } from './db/database.js';
import { hashPassword, verifyPassword } from './modules/auth/password.js';
import { registerTransactionRoutes } from './modules/transactions/routes.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; jti: string };
    user: { sub: string; jti: string };
  }
}

const SESSION_SECONDS = 60 * 60;
export async function buildApp(config: Config, db: Database) {
  const app = Fastify({
    logger:
      config.NODE_ENV !== 'test'
        ? {
            redact: [
              'req.headers.cookie',
              'req.headers.authorization',
              'res.headers["set-cookie"]',
            ],
          }
        : false,
    bodyLimit: 16 * 1024,
  });
  const secure = config.NODE_ENV === 'production';
  const cookieOptions = { path: '/api', httpOnly: true, secure, sameSite: 'strict' as const };
  await app.register(helmet);
  await app.register(cookie);
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: 'session', signed: false },
    sign: { iss: 'loopr-api', aud: 'loopr-web', expiresIn: SESSION_SECONDS },
    verify: { allowedIss: 'loopr-api', allowedAud: 'loopr-web', algorithms: ['HS256'] },
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: (request) => !request.url.startsWith('/api/'),
  });
  const dummyHash = await hashPassword(randomUUID());

  app.setErrorHandler((error, request, reply) => {
    const status =
      error instanceof ZodError
        ? 400
        : error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
          ? error.statusCode
          : 500;
    const code =
      status === 400
        ? 'INVALID_REQUEST'
        : status === 401
          ? 'UNAUTHORIZED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 429
              ? 'RATE_LIMITED'
              : 'INTERNAL_ERROR';
    if (status >= 500) request.log.error({ err: error }, 'Request failed');
    const message =
      status === 400
        ? 'Check the submitted fields and try again.'
        : status === 401
          ? 'Please sign in with valid credentials.'
          : status === 403
            ? 'This request is not allowed.'
            : status === 429
              ? 'Too many requests. Please try again shortly.'
              : 'Something went wrong. Please try again.';
    const fields =
      error instanceof ZodError
        ? Object.fromEntries(
            error.issues
              .filter((issue) => issue.path.length)
              .map((issue) => [issue.path.join('.'), issue.message]),
          )
        : undefined;
    return reply
      .code(status)
      .send({ error: { code, message, requestId: request.id, ...(fields ? { fields } : {}) } });
  });

  // A custom header plus exact Origin validation protects cookie-authenticated writes.
  // Non-browser API clients may omit Origin, but must send the explicit header.
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (
        request.headers['x-requested-with'] !== 'loopr' ||
        (request.headers.origin && request.headers.origin !== new URL(config.APP_ORIGIN).origin)
      ) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'This request is not allowed.',
            requestId: request.id,
          },
        });
      }
    }
  });

  app.get('/api/health/live', async () => ({ status: 'ok' }));
  app.get('/api/health/ready', async (_request, reply) => {
    try {
      await db.ping();
      return { status: 'ok' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  app.post(
    '/api/auth/register',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = registerSchema.parse(request.body);
      const user = {
        id: randomUUID(),
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      };
      try {
        await db.users.insertOne(user);
      } catch (error) {
        // The unique email index also handles concurrent registration attempts.
        if (error instanceof MongoServerError && error.code === 11000) {
          return reply.code(409).send({
            error: {
              code: 'ACCOUNT_EXISTS',
              message: 'An account already exists for this email. Please sign in.',
              requestId: request.id,
            },
          });
        }
        throw error;
      }
      // Registration does not issue a session: a successful response means the
      // account is persisted, even if a subsequent login request fails.
      return reply.code(201).send({ user: { id: user.id, email: user.email, name: user.name } });
    },
  );

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const user = await db.users.findOne({ email: input.email });
      const valid = await verifyPassword(input.password, user?.passwordHash ?? dummyHash);
      if (!user || !valid)
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Email or password is incorrect.',
            requestId: request.id,
          },
        });
      const sessionId = randomUUID();
      await db.sessions.insertOne({
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
      });
      const token = app.jwt.sign({ sub: user.id, jti: sessionId });
      reply.setCookie('session', token, { ...cookieOptions, maxAge: SESSION_SECONDS });
      return { user: { id: user.id, email: user.email, name: user.name } };
    },
  );

  await app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Your session has expired. Please sign in.',
            requestId: request.id,
          },
        });
      }
      const session = await db.sessions.findOne({
        id: request.user.jti,
        userId: request.user.sub,
        expiresAt: { $gt: new Date() },
      });
      if (!session)
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please sign in again.',
            requestId: request.id,
          },
        });
    });
    protectedApp.get('/api/auth/me', async (request, reply) => {
      const user = await db.users.findOne({ id: request.user.sub });
      if (!user)
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please sign in again.',
            requestId: request.id,
          },
        });
      return { user: { id: user.id, email: user.email, name: user.name } };
    });
    protectedApp.post('/api/auth/logout', async (request, reply) => {
      await db.sessions.deleteOne({ id: request.user.jti, userId: request.user.sub });
      return reply.clearCookie('session', cookieOptions).code(204).send();
    });
    registerTransactionRoutes(protectedApp, db);
  });

  const webRoot = fileURLToPath(new URL('../../web/dist', import.meta.url));
  if (existsSync(webRoot)) {
    await app.register(staticFiles, { root: webRoot, prefix: '/' });
    app.setNotFoundHandler((request, reply) => {
      if (
        request.method === 'GET' &&
        !request.url.startsWith('/api') &&
        request.headers.accept?.includes('text/html')
      )
        return reply.sendFile('index.html');
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: 'Resource not found.', requestId: request.id },
      });
    });
  }
  return app;
}
