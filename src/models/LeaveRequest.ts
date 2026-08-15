import { mysqlTable, int, date, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const leaveRequests = mysqlTable('leave_requests', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  leave_type: mysqlEnum('leave_type', ['sick', 'bereavement', 'maternity', 'paternity', 'casual', 'annual']).notNull(),
  start_date: date('start_date', { mode: 'string' }).notNull(),
  end_date: date('end_date', { mode: 'string' }).notNull(),
  reason: text('reason'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).notNull().default('pending'),
  reviewed_by: int('reviewed_by'),
  reviewed_at: timestamp('reviewed_at', { mode: 'date' }),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
