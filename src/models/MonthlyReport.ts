import { mysqlTable, int, varchar, text, tinyint, smallint, timestamp } from 'drizzle-orm/mysql-core';

// Submission log — no update endpoint exists (only submit/delete), and
// employee_id already unambiguously identifies the submitter, so this
// deliberately skips BaseModel (see instruction.md).
export const monthlyReports = mysqlTable('monthly_reports', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  month: tinyint('month').notNull(),
  year: smallint('year').notNull(),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  file_path: varchar('file_path', { length: 500 }).notNull(),
  file_size: int('file_size'),
  notes: text('notes'),
  submitted_at: timestamp('submitted_at', { mode: 'date' }).notNull().defaultNow(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type NewMonthlyReport = typeof monthlyReports.$inferInsert;
