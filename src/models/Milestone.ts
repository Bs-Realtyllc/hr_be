import { mysqlTable, int, varchar, date, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// Project sub-resource — no BaseModel (see instruction.md).
export const milestones = mysqlTable('milestones', {
  id: int('id').autoincrement().primaryKey(),
  project_id: int('project_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  due_date: date('due_date', { mode: 'string' }).notNull(),
  status: mysqlEnum('status', ['pending', 'in_progress', 'completed']).default('pending'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
