import { mysqlView, int, varchar, text, date, json, boolean, timestamp, decimal, mysqlEnum } from 'drizzle-orm/mysql-core';

// Read-only view over `employees_flat` (see
// src/db/migrate_normalize_employees_p2.sql) — reproduces the exact
// pre-redesign `employees` column shape by joining employee_auth/
// employee_profile/employee_documents/employee_compensation_history/
// departments/designations back onto the slimmed `employees` row. Every read
// in employee.repository.ts goes through this instead of the underlying
// tables; every write still targets the underlying tables directly (a view
// isn't writable here — it spans a JOIN).
//
// `.existing()` — this view is created/owned by
// migrate_normalize_employees_p2.sql, not by Drizzle; this definition only
// describes its shape for typed queries.
export const employeesFlat = mysqlView('employees_flat', {
  id: int('id'),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 150 }),
  secondary_email: varchar('secondary_email', { length: 150 }),
  phone: varchar('phone', { length: 20 }),
  alt_phone: varchar('alt_phone', { length: 20 }),
  discord_username: varchar('discord_username', { length: 100 }),
  emergency_contact: varchar('emergency_contact', { length: 150 }),
  dob: date('dob', { mode: 'string' }),
  bio: text('bio'),
  address: text('address'),
  profile_picture: varchar('profile_picture', { length: 255 }),
  citizenship_front: varchar('citizenship_front', { length: 255 }),
  citizenship_back: varchar('citizenship_back', { length: 255 }),
  designation: varchar('designation', { length: 100 }),
  designation_id: int('designation_id'),
  department: varchar('department', { length: 100 }),
  department_id: int('department_id'),
  manager_id: int('manager_id'),
  start_date: date('start_date', { mode: 'string' }),
  timezone: varchar('timezone', { length: 50 }),
  work_hours: varchar('work_hours', { length: 50 }),
  tech_stack: json('tech_stack').$type<string[]>(),
  qualifications: json('qualifications').$type<string[]>(),
  role: mysqlEnum('role', ['admin', 'lead', 'employee']),
  password_hash: varchar('password_hash', { length: 255 }),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  pay_frequency: mysqlEnum('pay_frequency', ['monthly', 'biweekly', 'weekly']),
  is_active: boolean('is_active'),
  status: varchar('status', { length: 20 }),
  termination_date: date('termination_date', { mode: 'string' }),
  termination_reason: varchar('termination_reason', { length: 255 }),
  created_at: timestamp('created_at', { mode: 'date' }),
  leave_policy_accepted: boolean('leave_policy_accepted'),
  leave_policy_accepted_at: timestamp('leave_policy_accepted_at', { mode: 'date' }),
}).existing();

export type EmployeeFlat = typeof employeesFlat.$inferSelect;
