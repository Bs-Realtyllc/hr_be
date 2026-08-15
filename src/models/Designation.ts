import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { departments } from './Department';

export const designations = mysqlTable('designations', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 100 }).notNull().unique(),
  department_id: int('department_id').references(() => departments.id, { onDelete: 'set null' }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;
