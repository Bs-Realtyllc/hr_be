import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { departments } from './Department';

// Lookup table, replacing the free-text `designation` column. Not on
// BaseModel — plain reference data, no created_by/updated_by tracking.
export const designations = mysqlTable('designations', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 100 }).notNull().unique(),
  department_id: int('department_id').references(() => departments.id, { onDelete: 'set null' }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;
