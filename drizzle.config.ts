import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  // Tracked separately from src/models/*.ts (the ORM query layer) — this file
  // is drizzle-kit's own source of truth for migrations, seeded from a live
  // introspection of prod so the baseline matches reality exactly, including
  // FKs/indexes the hand-written app models don't declare.
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
} satisfies Config;
