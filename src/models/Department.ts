import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

// Lookup table, replacing the free-text `department` column. Not on
// BaseModel — plain reference data, no created_by/updated_by tracking.
export const departments = mysqlTable('departments', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
