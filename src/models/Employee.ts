import { mysqlTable, int, varchar, date, json, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const employees = mysqlTable('employees', {
  ...baseColumns,
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  secondary_email: varchar('secondary_email', { length: 150 }).unique(),
  manager_id: int('manager_id'),
  start_date: date('start_date', { mode: 'string' }),
  tech_stack: json('tech_stack').$type<string[]>(),
  qualifications: json('qualifications').$type<string[]>(),
  designation_id: int('designation_id'),
  department_id: int('department_id'),
  is_active: boolean('is_active').notNull().default(true),
  status: mysqlEnum('status', ['onboarding', 'active', 'on_leave', 'probation', 'terminated'])
    .notNull()
    .default('active'),
  termination_date: date('termination_date', { mode: 'string' }),
  termination_reason: varchar('termination_reason', { length: 255 }),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
