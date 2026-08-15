import { mysqlTable, int, date, varchar, timestamp } from 'drizzle-orm/mysql-core';

// Effective-dated, append-only audit trail of designation/department/manager
// changes. Not on BaseModel — a history row is never updated after insert
// (effective_to is set once, to close it out), and it already carries its own
// audit field (changed_by) rather than created_by/updated_by.
export const employeeJobHistory = mysqlTable('employee_job_history', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  designation_id: int('designation_id'),
  department_id: int('department_id'),
  manager_id: int('manager_id'),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  change_reason: varchar('change_reason', { length: 255 }),
  changed_by: int('changed_by'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type EmployeeJobHistory = typeof employeeJobHistory.$inferSelect;
export type NewEmployeeJobHistory = typeof employeeJobHistory.$inferInsert;
