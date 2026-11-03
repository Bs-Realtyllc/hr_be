import { mysqlTable, int, varchar, text, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const employeeOffboardingTasks = mysqlTable('employee_offboarding_tasks', {
  ...baseColumns,
  offboarding_id: int('offboarding_id').notNull(),
  category: mysqlEnum('category', ['hr', 'it', 'finance', 'manager']).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  status: mysqlEnum('status', ['pending', 'completed', 'not_applicable']).notNull().default('pending'),
  notes: text('notes'),
  completed_by: int('completed_by'),
  completed_at: timestamp('completed_at', { mode: 'date' }),
});

export type EmployeeOffboardingTask = typeof employeeOffboardingTasks.$inferSelect;
export type NewEmployeeOffboardingTask = typeof employeeOffboardingTasks.$inferInsert;
