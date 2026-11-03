import { mysqlTable, int, varchar, text, date, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const employeeOffboarding = mysqlTable('employee_offboarding', {
  ...baseColumns,
  emp_id: int('emp_id').notNull(),
  exit_type: mysqlEnum('exit_type', ['resignation', 'termination', 'end_of_contract', 'non_renewal']).notNull(),
  reason: text('reason'),
  notice_date: date('notice_date', { mode: 'string' }).notNull(),
  last_working_day: date('last_working_day', { mode: 'string' }).notNull(),
  status: mysqlEnum('status', ['in_progress', 'completed', 'cancelled']).notNull().default('in_progress'),
  // employees.status at the moment this record was initiated, restored if the offboarding is cancelled
  previous_status: varchar('previous_status', { length: 20 }).notNull(),
  relieving_letter_path: varchar('relieving_letter_path', { length: 255 }),
  completed_at: timestamp('completed_at', { mode: 'date' }),
  cancelled_at: timestamp('cancelled_at', { mode: 'date' }),
});

export type EmployeeOffboarding = typeof employeeOffboarding.$inferSelect;
export type NewEmployeeOffboarding = typeof employeeOffboarding.$inferInsert;
