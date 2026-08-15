import { mysqlTable, int, text, date } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const standups = mysqlTable('standups', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  yesterday: text('yesterday'),
  today: text('today'),
  blockers: text('blockers'),
  standup_date: date('standup_date', { mode: 'string' }).notNull(),
});

export type Standup = typeof standups.$inferSelect;
export type NewStandup = typeof standups.$inferInsert;
