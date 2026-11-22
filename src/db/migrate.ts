import 'dotenv/config';
import path from 'path';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from '../config/database';
import { maintainLogPartitions } from '../pkg/maintainLogPartitions';

(async () => {
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await bootstrap.end();

  await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle/migrations') });
  console.log('drizzle-kit migrations applied');
  await pool.end();

  // The log tables have no catch-all partition; bring them up to date right away so a DB
  // migrated after the dates hard-coded in 0014 doesn't reject log inserts until the next cron run.
  if (!(await maintainLogPartitions())) process.exitCode = 1;
})().catch((err) => {
  console.error('drizzle-kit migration run aborted:', err.message);
  if (err.cause) console.error('caused by:', err.cause.message ?? err.cause);
  process.exit(1);
});
