import { int, timestamp } from 'drizzle-orm/mysql-core';

export const auditColumns = {
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  created_by: int('created_by'),
  updated_by: int('updated_by'),
};

export const baseColumns = {
  id: int('id').autoincrement().primaryKey(),
  ...auditColumns,
};
