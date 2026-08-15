import { mysqlTable, int, varchar, date, json, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

// Core identity + current-state pointer columns only — see
// src/db/migrate_normalize_employees_p3.sql for what moved off this table onto
// employee_auth/employee_profile/employee_compensation_history/employee_documents,
// and src/models/EmployeeFlat.ts for the read-side view that joins it all back
// together in the pre-redesign shape.
//
// Column-level `.references()` is deliberately not used here — this app keeps
// the hand-rolled schema.sql/migrate_*.sql pipeline as the source of truth for
// DDL/FKs (see those files), not drizzle-kit, so Drizzle never generates schema
// from these definitions. Cross-table relationships for the query API are
// declared once, explicitly, in src/models/index.ts instead.
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
