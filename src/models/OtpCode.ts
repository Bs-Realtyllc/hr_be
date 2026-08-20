import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const otpCodes = mysqlTable('otp_codes', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  code_hash: varchar('code_hash', { length: 255 }).notNull(),
  attempts: int('attempts').notNull().default(0),
  max_attempts: int('max_attempts').notNull().default(5),
  expires_at: timestamp('expires_at', { mode: 'date' }).notNull(),
  used_at: timestamp('used_at', { mode: 'date' }),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
