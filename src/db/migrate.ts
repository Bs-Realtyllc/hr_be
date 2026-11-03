import 'dotenv/config';
import path from 'path';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from '../config/database';

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
})().catch((err) => {
  console.error('drizzle-kit migration run aborted:', err.message);
  process.exit(1);
});
