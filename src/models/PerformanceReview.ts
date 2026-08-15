import { mysqlTable, int, varchar, text, decimal, json, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const performanceReviews = mysqlTable('performance_reviews', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  reviewer_id: int('reviewer_id'),
  review_period: varchar('review_period', { length: 20 }).notNull(),
  overall_rating: decimal('overall_rating', { precision: 2, scale: 1 }),
  category_ratings: json('category_ratings').$type<Record<string, number>>(),
  strengths: text('strengths'),
  improvements: text('improvements'),
  manager_comments: text('manager_comments'),
  employee_comments: text('employee_comments'),
  status: mysqlEnum('status', ['draft', 'submitted', 'acknowledged']).default('draft'),
  submitted_at: timestamp('submitted_at', { mode: 'date' }),
  acknowledged_at: timestamp('acknowledged_at', { mode: 'date' }),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  updated_by: int('updated_by'),
});

export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type NewPerformanceReview = typeof performanceReviews.$inferInsert;
