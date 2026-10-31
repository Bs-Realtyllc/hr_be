import { mysqlTable, int, text, tinyint, timestamp } from 'drizzle-orm/mysql-core';

export const inboxMessages = mysqlTable('inbox_messages', {
  id:          int('id').autoincrement().primaryKey(),
  channel_id:  int('channel_id').notNull(),
  employee_id: int('employee_id').notNull(),
  content:     text('content').notNull(),
  is_edited:   tinyint('is_edited').notNull().default(0),
  is_pinned:   tinyint('is_pinned').notNull().default(0),
  reply_to_id: int('reply_to_id'),
  created_at:  timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at:  timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  deleted_at:  timestamp('deleted_at', { mode: 'date' }),
});

export type InboxMessage    = typeof inboxMessages.$inferSelect;
export type NewInboxMessage = typeof inboxMessages.$inferInsert;
