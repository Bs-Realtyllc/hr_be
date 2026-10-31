import { mysqlTable, int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';

export const inboxVoicePresence = mysqlTable('inbox_voice_presence', {
  id:          int('id').autoincrement().primaryKey(),
  channel_id:  int('channel_id').notNull(),
  employee_id: int('employee_id').notNull(),
  joined_at:   timestamp('joined_at', { mode: 'date' }).notNull().defaultNow(),
});

export const inboxPresence = mysqlTable('inbox_presence', {
  employee_id: int('employee_id').primaryKey(),
  status:      mysqlEnum('status', ['online', 'away', 'dnd', 'offline']).notNull().default('offline'),
  last_seen:   timestamp('last_seen', { mode: 'date' }).notNull().defaultNow(),
});

export type InboxVoicePresence    = typeof inboxVoicePresence.$inferSelect;
export type InboxPresenceRow      = typeof inboxPresence.$inferSelect;
