import { mysqlTable, int, varchar, text, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const servers = mysqlTable('servers', {
  ...baseColumns,
  project_id: int('project_id'),
  name: varchar('name', { length: 100 }).notNull(),
  environment: mysqlEnum('environment', ['development', 'staging', 'production']).notNull(),
  ip_address: varchar('ip_address', { length: 45 }),
  domain: varchar('domain', { length: 255 }),
  ssh_user: varchar('ssh_user', { length: 100 }),
  notes: text('notes'),
  is_sensitive: boolean('is_sensitive').default(false),
});

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
