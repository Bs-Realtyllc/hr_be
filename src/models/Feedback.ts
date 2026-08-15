import { mysqlTable, int, text, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';

// Immutable (create + delete only, no update endpoint) — skips BaseModel,
// same rationale as monthly_reports/weekly_reports.
export const feedbackNotes = mysqlTable('feedback_notes', {
  id: int('id').autoincrement().primaryKey(),
  from_employee_id: int('from_employee_id').notNull(),
  to_employee_id: int('to_employee_id').notNull(),
  feedback_type: mysqlEnum('feedback_type', ['praise', 'constructive', 'peer', 'manager']).default('praise'),
  visibility: mysqlEnum('visibility', ['public', 'private']).default('public'),
  message: text('message').notNull(),
  project_id: int('project_id'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type FeedbackNote = typeof feedbackNotes.$inferSelect;
export type NewFeedbackNote = typeof feedbackNotes.$inferInsert;
