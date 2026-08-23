import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

export const employeeDocuments = mysqlTable('employee_documents', {
  id: int('id').autoincrement().primaryKey(),
  emp_id: int('emp_id').notNull(),
  url: varchar('url', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
});

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type NewEmployeeDocument = typeof employeeDocuments.$inferInsert;
