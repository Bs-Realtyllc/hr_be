import { mysqlTable, int, date, text, varchar, decimal, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const overtimeRequests = mysqlTable('overtime_requests', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  project_id: int('project_id'),
  work_date: date('work_date', { mode: 'string' }).notNull(),
  hours: decimal('hours', { precision: 4, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  approved_by_name: varchar('approved_by_name', { length: 150 }).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  reviewed_by: int('reviewed_by'),
  reviewed_at: timestamp('reviewed_at', { mode: 'date' }),
  hourly_rate: decimal('hourly_rate', { precision: 12, scale: 2 }),
  overtime_rate: decimal('overtime_rate', { precision: 12, scale: 2 }),
  amount: decimal('amount', { precision: 12, scale: 2 }),
});

export type OvertimeRequest = typeof overtimeRequests.$inferSelect;
export type NewOvertimeRequest = typeof overtimeRequests.$inferInsert;
