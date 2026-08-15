import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_platform',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00',
});

export const db = drizzle(pool, { mode: 'default' });

export default db;
