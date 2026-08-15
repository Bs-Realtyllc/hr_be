import { mysqlTable, int, varchar, text, date, decimal, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// Already has id/created_at/updated_at/created_by (its own "who created this
// goal" column, serving BaseModel's role) — just adding updated_by directly
// here rather than via baseColumns, to avoid a duplicate `created_by`.
export const goals = mysqlTable('goals', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['individual', 'team', 'company']).default('individual'),
  metric_unit: varchar('metric_unit', { length: 30 }).default('%'),
  target_value: decimal('target_value', { precision: 12, scale: 2 }).default('100.00'),
  current_value: decimal('current_value', { precision: 12, scale: 2 }).default('0.00'),
  weight: int('weight').default(3),
  status: mysqlEnum('status', ['not_started', 'in_progress', 'at_risk', 'completed', 'missed']).default('not_started'),
  start_date: date('start_date', { mode: 'string' }),
  due_date: date('due_date', { mode: 'string' }),
  created_by: int('created_by'),
  updated_by: int('updated_by'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
