import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires_at: timestamp('expires_at', { mode: 'date' }).notNull(),
  used_at: timestamp('used_at', { mode: 'date' }),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
