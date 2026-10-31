import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const inboxMessageReactions = mysqlTable('inbox_message_reactions', {
  id:          int('id').autoincrement().primaryKey(),
  message_id:  int('message_id').notNull(),
  employee_id: int('employee_id').notNull(),
  emoji:       varchar('emoji', { length: 12 }).notNull(),
  created_at:  timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type InboxReaction    = typeof inboxMessageReactions.$inferSelect;
export type NewInboxReaction = typeof inboxMessageReactions.$inferInsert;
