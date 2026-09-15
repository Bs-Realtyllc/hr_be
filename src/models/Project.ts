import { mysqlTable, varchar, text, date, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const projects = mysqlTable('projects', {
  ...baseColumns,
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  repo_url: text('repo_url'),
  docs_url: text('docs_url'),
  status: mysqlEnum('status', ['active', 'archived', 'on_hold']).default('active'),
  roadmap_key: varchar('roadmap_key', { length: 50 }),
  roadmap_label: varchar('roadmap_label', { length: 100 }),
  public_link: varchar('public_link', { length: 255 }),
  start_date: date('start_date', { mode: 'string' }),
  expected_end_date: date('expected_end_date', { mode: 'string' }),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
