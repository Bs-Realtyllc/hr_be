import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

// 1:1 with employees, keyed on employee_id — same rationale as
// EmployeeAuth.ts for using auditColumns instead of the full baseColumns.
export const emailSettings = mysqlTable('email_settings', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull().unique(),
  smtp_host: varchar('smtp_host', { length: 255 }).notNull().default('smtp.gmail.com'),
  smtp_port: int('smtp_port').notNull().default(587),
  smtp_user: varchar('smtp_user', { length: 255 }).notNull(),
  smtp_pass: varchar('smtp_pass', { length: 255 }).notNull(),
  smtp_from: varchar('smtp_from', { length: 255 }),
  default_to: text('default_to'),
  default_cc: text('default_cc'),
  default_bcc: text('default_bcc'),
  ...auditColumns,
});

export type EmailSettingsRow = typeof emailSettings.$inferSelect;
export type NewEmailSettings = typeof emailSettings.$inferInsert;
