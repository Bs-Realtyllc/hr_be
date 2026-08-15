import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const projectServices = mysqlTable('project_services', {
  id: int('id').autoincrement().primaryKey(),
  project_id: int('project_id').notNull(),
  service_key: varchar('service_key', { length: 50 }).notNull(),
  assigned_at: timestamp('assigned_at', { mode: 'date' }).notNull().defaultNow(),
});

export type ProjectService = typeof projectServices.$inferSelect;
export type NewProjectService = typeof projectServices.$inferInsert;
