import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  // Single source of truth for both drizzle-kit migrations and the app's
  // query layer (src/ imports its tables from here). Seeded from a live
  // introspection of prod, so it carries the real FKs/indexes too.
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
