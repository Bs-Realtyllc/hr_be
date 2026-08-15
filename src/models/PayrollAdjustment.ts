import { mysqlTable, int, varchar, decimal, year, tinyint, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const payrollAdjustments = mysqlTable('payroll_adjustments', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  type: mysqlEnum('type', ['overtime_pay', 'leave_deduction', 'leave_bonus']).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  year: year('year').notNull(),
  month: tinyint('month'),
  reference_type: mysqlEnum('reference_type', ['overtime_request', 'leave_request']),
  reference_id: int('reference_id'),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type PayrollAdjustment = typeof payrollAdjustments.$inferSelect;
export type NewPayrollAdjustment = typeof payrollAdjustments.$inferInsert;
