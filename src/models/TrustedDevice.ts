import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const trustedDevices = mysqlTable('trusted_devices', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  token_hash: varchar('token_hash', { length: 255 }).notNull(),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: varchar('user_agent', { length: 500 }),
  expires_at: timestamp('expires_at', { mode: 'date' }).notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  last_used_at: timestamp('last_used_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type NewTrustedDevice = typeof trustedDevices.$inferInsert;
