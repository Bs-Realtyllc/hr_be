import { mysqlTable, int, varchar, text, date, timestamp, boolean } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

export const employeeProfile = mysqlTable('employee_profile', {
  employee_id: int('employee_id').primaryKey(),
  phone: varchar('phone', { length: 20 }),
  alt_phone: varchar('alt_phone', { length: 20 }),
  discord_username: varchar('discord_username', { length: 100 }).unique(),
  emergency_contact: varchar('emergency_contact', { length: 150 }),
  dob: date('dob', { mode: 'string' }),
  bio: text('bio'),
  address: text('address'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  work_hours: varchar('work_hours', { length: 50 }).notNull().default('9 AM - 5 PM'),
  leave_policy_accepted: boolean('leave_policy_accepted').notNull().default(false),
  leave_policy_accepted_at: timestamp('leave_policy_accepted_at', { mode: 'date' }),
  ...auditColumns,
});

export type EmployeeProfile = typeof employeeProfile.$inferSelect;
export type NewEmployeeProfile = typeof employeeProfile.$inferInsert;
