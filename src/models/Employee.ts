import { mysqlTable, int, varchar, date, text, mysqlEnum } from 'drizzle-orm/mysql-core';

export const employees = mysqlTable('employees', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  secondary_email: varchar('secondary_email', { length: 150 }).unique(),
  designation_id: int('designation_id'),
  department_id: int('department_id'),
  manager_id: int('manager_id'),
  start_date: date('start_date', { mode: 'string' }),
  dob: date('dob', { mode: 'string' }),
  gender: mysqlEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']),
  github_url: varchar('github_url', { length: 255 }),
  address: text('address'),
  discord_username: varchar('discord_username', { length: 100 }).unique(),
  panNo: varchar('panNo', { length: 50 }).unique(),
  role: mysqlEnum('role', ['admin', 'lead', 'employee', 'intern']).notNull().default('employee'),
  password_hash: varchar('password_hash', { length: 255 }),
  status: mysqlEnum('status', ['onboarding', 'active', 'on_leave', 'probation', 'terminated'])
    .notNull()
    .default('active'),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
