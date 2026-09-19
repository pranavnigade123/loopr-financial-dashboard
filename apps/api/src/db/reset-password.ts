import { readConfig } from '../config.js';
import { connectDatabase } from './database.js';
import { hashPassword } from '../modules/auth/password.js';
import { registerSchema } from '@loopr/contracts';

async function reset() {
  const config = readConfig();
  const input = registerSchema.parse({
    name: 'Demo Analyst',
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  });
  const { client, db } = await connectDatabase(config.MONGODB_URI);
  try {
    const user = await db.users.findOne({ email: input.email });
    if (!user) throw new Error('Account missing');
    await db.users.updateOne(
      { id: user.id },
      { $set: { passwordHash: await hashPassword(input.password) } },
    );
    await db.sessions.deleteMany({ userId: user.id });
    console.info('Demo password updated from .env and existing sessions revoked.');
  } finally {
    await client.close();
  }
}
reset().catch(() => {
  console.error(
    'Reset failed. Check database access and demo credentials; the account must already exist.',
  );
  process.exitCode = 1;
});
