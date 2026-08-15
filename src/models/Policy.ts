import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

// uploaded_by already identifies the creator of each version — skips
// BaseModel's created_by/updated_by (is_pinned/is_active are narrow toggles,
// not general edits worth an audit trail for this pass).
export const policies = mysqlTable('policies', {
  id: int('id').autoincrement().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  file_path: varchar('file_path', { length: 255 }).notNull(),
  version: int('version').notNull().default(1),
  uploaded_by: int('uploaded_by'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  category: varchar('category', { length: 30 }).notNull().default('policy'),
  is_pinned: boolean('is_pinned').default(false),
});

export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;
