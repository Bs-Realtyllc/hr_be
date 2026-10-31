import { mysqlTable, int, varchar, mysqlEnum, timestamp, tinyint } from 'drizzle-orm/mysql-core';

export const inboxCategories = mysqlTable('inbox_categories', {
  id:         int('id').autoincrement().primaryKey(),
  name:       varchar('name', { length: 100 }).notNull(),
  position:   int('position').notNull().default(0),
  created_by: int('created_by'),
  created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const inboxChannels = mysqlTable('inbox_channels', {
  id:            int('id').autoincrement().primaryKey(),
  name:          varchar('name', { length: 100 }).notNull(),
  type:          mysqlEnum('type', ['text', 'voice', 'announcement']).notNull().default('text'),
  category:      mysqlEnum('category', ['text', 'voice']).notNull().default('text'),
  category_id:   int('category_id'),
  description:   varchar('description', { length: 500 }),
  position:      int('position').notNull().default(0),
  required_role: mysqlEnum('required_role', ['admin', 'lead', 'employee', 'intern']).notNull().default('intern'),
  is_archived:   tinyint('is_archived').notNull().default(0),
  is_private:    tinyint('is_private').notNull().default(0),
  created_at:    timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updated_at:    timestamp('updated_at', { mode: 'date' }).onUpdateNow(),
  created_by:    int('created_by'),
  updated_by:    int('updated_by'),
});

export const inboxChannelMembers = mysqlTable('inbox_channel_members', {
  id:           int('id').autoincrement().primaryKey(),
  channel_id:   int('channel_id').notNull(),
  employee_id:  int('employee_id').notNull(),
  role:         mysqlEnum('role', ['admin', 'member', 'readonly']).notNull().default('member'),
  joined_at:    timestamp('joined_at', { mode: 'date' }).notNull().defaultNow(),
  last_read_at: timestamp('last_read_at', { mode: 'date' }),
});

export type InboxCategory      = typeof inboxCategories.$inferSelect;
export type InboxChannel       = typeof inboxChannels.$inferSelect;
export type NewInboxChannel    = typeof inboxChannels.$inferInsert;
export type InboxChannelMember = typeof inboxChannelMembers.$inferSelect;
