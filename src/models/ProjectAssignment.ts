import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

// Join table (project <-> employee) — no BaseModel, same as other join/lookup
// tables in this app.
export const projectAssignments = mysqlTable('project_assignments', {
  id: int('id').autoincrement().primaryKey(),
  project_id: int('project_id').notNull(),
  employee_id: int('employee_id').notNull(),
  role: varchar('role', { length: 100 }).notNull().default('developer'),
  assigned_at: timestamp('assigned_at', { mode: 'date' }).notNull().defaultNow(),
});

export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type NewProjectAssignment = typeof projectAssignments.$inferInsert;
