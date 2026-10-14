import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const loginHistory = mysqlTable('login_history', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id'),
  email: varchar('email', { length: 255 }).notNull(),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: varchar('user_agent', { length: 500 }),
  success: boolean('success').notNull(),
  failure_reason: varchar('failure_reason', { length: 50 }),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type NewLoginHistory = typeof loginHistory.$inferInsert;
