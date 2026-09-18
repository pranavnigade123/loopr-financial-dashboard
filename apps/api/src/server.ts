import { readConfig } from './config.js';
import { connectDatabase } from './db/database.js';
import { buildApp } from './app.js';

async function start() {
  const config = readConfig();
  const { client, db } = await connectDatabase(config.MONGODB_URI);
  const app = await buildApp(config, db);
  app.addHook('onClose', async () => {
    await client.close();
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void app.close().catch(() => {
        process.exitCode = 1;
      });
    });
  }
  try {
    await app.listen({ host: '0.0.0.0', port: config.PORT });
  } catch (error) {
    await app.close();
    throw error;
  }
}

start().catch(() => {
  console.error('API startup failed. Check environment configuration and MongoDB availability.');
  process.exitCode = 1;
});
