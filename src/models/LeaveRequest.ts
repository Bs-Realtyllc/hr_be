import { mysqlTable, int, date, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const leaveRequests = mysqlTable('leave_requests', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  // 'casual'/'annual' are retired for new requests (see
  // src/db/migrate_leave_policy.sql) but kept in the enum so historical rows
  // stay valid — leave.dto.ts's LEAVE_TYPES restricts what a *new* request
  // may use to the current four.
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
