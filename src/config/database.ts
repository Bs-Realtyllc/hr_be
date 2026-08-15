import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

// New ORM-backed connection, used only by domains converted to Drizzle
// (currently: Employees, Auth). Everything else still goes through the
// legacy mysql2 pool in src/db/index.js until it's converted too — both
// point at the same database, so they're safe to run side by side.
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

// Plain core query-builder mode (no relational `db.query.*` API) — schema
// definitions in src/models/ stay pure table/view metadata with no need to
// wire up a combined `schema` object here. Self-joins (e.g. manager lookups)
// use `alias()` + `.leftJoin()` directly in the repository instead.
export const db = drizzle(pool, { mode: 'default' });

export default db;
