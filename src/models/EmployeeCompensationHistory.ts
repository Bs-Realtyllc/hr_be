import { mysqlTable, int, date, varchar, decimal, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// Effective-dated, append-only audit trail of salary/pay-frequency changes.
// Not on BaseModel — see EmployeeJobHistory.ts for the same rationale.
export const employeeCompensationHistory = mysqlTable('employee_compensation_history', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }).notNull(),
  pay_frequency: mysqlEnum('pay_frequency', ['monthly', 'biweekly', 'weekly']).notNull().default('monthly'),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  change_reason: varchar('change_reason', { length: 255 }),
  changed_by: int('changed_by'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type EmployeeCompensationHistory = typeof employeeCompensationHistory.$inferSelect;
export type NewEmployeeCompensationHistory = typeof employeeCompensationHistory.$inferInsert;
