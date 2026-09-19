import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Azure supplies settings through process.env; local files are development-only.
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.url(),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

export type Config = z.infer<typeof environmentSchema>;
export function readConfig(): Config {
  return parseConfig(process.env);
}

export function parseConfig(environment: Record<string, string | undefined>): Config {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}. See .env.example.`,
    );
  }
  const origin = new URL(result.data.APP_ORIGIN);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/'
  ) {
    throw new Error(
      'APP_ORIGIN must be an HTTP(S) origin without credentials, a path, query, or fragment.',
    );
  }
  if (result.data.NODE_ENV === 'production' && origin.protocol !== 'https:') {
    throw new Error('APP_ORIGIN must use HTTPS in production.');
  }
  return { ...result.data, APP_ORIGIN: origin.origin };
}
