import { mysqlTable, int, varchar, text, date, timestamp } from 'drizzle-orm/mysql-core';

// Same rationale as MonthlyReport.ts for skipping BaseModel.
export const weeklyReports = mysqlTable('weekly_reports', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  week_start_date: date('week_start_date', { mode: 'string' }).notNull(),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  file_path: varchar('file_path', { length: 500 }).notNull(),
  file_size: int('file_size'),
  notes: text('notes'),
  submitted_at: timestamp('submitted_at', { mode: 'date' }).notNull().defaultNow(),
});

export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type NewWeeklyReport = typeof weeklyReports.$inferInsert;
