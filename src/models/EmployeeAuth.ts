import { mysqlTable, int, varchar, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

export const employeeAuth = mysqlTable('employee_auth', {
  employee_id: int('employee_id').primaryKey(),
  password_hash: varchar('password_hash', { length: 255 }),
  role: mysqlEnum('role', ['admin', 'lead', 'employee']).notNull().default('employee'),
  last_login_at: timestamp('last_login_at', { mode: 'date' }),
  ...auditColumns,
});

export type EmployeeAuth = typeof employeeAuth.$inferSelect;
export type NewEmployeeAuth = typeof employeeAuth.$inferInsert;
