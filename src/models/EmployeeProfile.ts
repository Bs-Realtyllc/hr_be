import { mysqlTable, int, varchar, text, date, timestamp, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

export const employeeProfile = mysqlTable('employee_profile', {
  employee_id: int('employee_id').primaryKey(),
  phone: varchar('phone', { length: 20 }),
  alt_phone: varchar('alt_phone', { length: 20 }),
  discord_username: varchar('discord_username', { length: 100 }).unique(),
  emergency_contact: varchar('emergency_contact', { length: 150 }),
  emergency_contact_name: varchar('emergency_contact_name', { length: 150 }),
  dob: date('dob', { mode: 'string' }),
  gender: mysqlEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']),
  bio: text('bio'),
  address: text('address'),
  permanent_address: text('permanent_address'),
  education_level: varchar('education_level', { length: 100 }),
  institution_name: varchar('institution_name', { length: 150 }),
  field_of_study: varchar('field_of_study', { length: 150 }),
  graduation_date: date('graduation_date', { mode: 'string' }),
  previous_experience: text('previous_experience'),
  areas_of_interest: text('areas_of_interest'),
  linkedin_url: varchar('linkedin_url', { length: 255 }),
  github_url: varchar('github_url', { length: 255 }),
  portfolio_url: varchar('portfolio_url', { length: 255 }),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  work_hours: varchar('work_hours', { length: 50 }).notNull().default('9 AM - 5 PM'),
  leave_policy_accepted: boolean('leave_policy_accepted').notNull().default(false),
  leave_policy_accepted_at: timestamp('leave_policy_accepted_at', { mode: 'date' }),
  ...auditColumns,
});

export type EmployeeProfile = typeof employeeProfile.$inferSelect;
export type NewEmployeeProfile = typeof employeeProfile.$inferInsert;
