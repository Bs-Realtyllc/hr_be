import { mysqlTable, int, text, tinyint, timestamp } from 'drizzle-orm/mysql-core';

export const inboxDmMessages = mysqlTable('inbox_dm_messages', {
  id:               int('id').autoincrement().primaryKey(),
  from_employee_id: int('from_employee_id').notNull(),
  to_employee_id:   int('to_employee_id').notNull(),
  content:          text('content').notNull(),
  is_edited:        tinyint('is_edited').notNull().default(0),
  is_read:          tinyint('is_read').notNull().default(0),
  created_at:       timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at:       timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  deleted_at:       timestamp('deleted_at', { mode: 'date' }),
});

export type InboxDmMessage    = typeof inboxDmMessages.$inferSelect;
export type NewInboxDmMessage = typeof inboxDmMessages.$inferInsert;
