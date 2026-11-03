import 'dotenv/config';
import path from 'path';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from '../config/database';

(async () => {
  await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle/migrations') });
  console.log('drizzle-kit migrations applied');
  await pool.end();
})().catch((err) => {
  console.error('drizzle-kit migration run aborted:', err.message);
  process.exit(1);
});
