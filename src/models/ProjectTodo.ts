import { mysqlTable, int, varchar, text, date, tinyint } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const projectTodos = mysqlTable('project_todos', {
  ...baseColumns,
  project_id: int('project_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  deadline: date('deadline', { mode: 'string' }),
  is_complete: tinyint('is_complete').notNull().default(0),
  sort_order: int('sort_order').notNull().default(0),
});

export type ProjectTodo = typeof projectTodos.$inferSelect;
export type NewProjectTodo = typeof projectTodos.$inferInsert;
