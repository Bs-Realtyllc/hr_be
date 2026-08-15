import { mysqlTable, varchar, text, date, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const projects = mysqlTable('projects', {
  ...baseColumns,
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  // Stored as a JSON-encoded string (not a native JSON column) — see
  // project.dto.ts's toJSON/toArr for the array <-> string shaping.
  repo_url: text('repo_url'),
  docs_url: text('docs_url'),
  status: mysqlEnum('status', ['active', 'archived', 'on_hold']).default('active'),
  start_date: date('start_date', { mode: 'string' }),
  expected_end_date: date('expected_end_date', { mode: 'string' }),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
