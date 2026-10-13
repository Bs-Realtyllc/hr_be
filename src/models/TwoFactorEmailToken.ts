import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const twoFactorEmailTokens = mysqlTable('two_factor_email_tokens', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  code_hash: varchar('code_hash', { length: 255 }).notNull(),
  expires_at: timestamp('expires_at', { mode: 'date' }).notNull(),
  used_at: timestamp('used_at', { mode: 'date' }),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TwoFactorEmailToken = typeof twoFactorEmailTokens.$inferSelect;
export type NewTwoFactorEmailToken = typeof twoFactorEmailTokens.$inferInsert;
