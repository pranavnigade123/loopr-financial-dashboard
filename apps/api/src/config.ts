import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.url(),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

export type Config = z.infer<typeof environmentSchema>;
export function readConfig(): Config {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}. See .env.example.`,
    );
  }
  if (result.data.NODE_ENV === 'production' && !result.data.APP_ORIGIN.startsWith('https://')) {
    throw new Error('APP_ORIGIN must use HTTPS in production.');
  }
  return result.data;
}
