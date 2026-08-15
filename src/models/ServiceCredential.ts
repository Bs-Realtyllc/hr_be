import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const serviceCredentials = mysqlTable('service_credentials', {
  ...baseColumns,
  employee_id: int('employee_id').notNull(),
  service_name: varchar('service_name', { length: 100 }).notNull(),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }),
  notes: text('notes'),
});

export type ServiceCredentialRow = typeof serviceCredentials.$inferSelect;
export type NewServiceCredential = typeof serviceCredentials.$inferInsert;
