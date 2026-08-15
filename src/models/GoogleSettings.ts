import { mysqlTable, int, text, varchar, datetime, timestamp } from 'drizzle-orm/mysql-core';

export const googleSettings = mysqlTable('google_settings', {
  id: int('id').autoincrement().primaryKey(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  token_expiry: datetime('token_expiry', { mode: 'date' }),
  channel_id: varchar('channel_id', { length: 255 }),
  resource_id: varchar('resource_id', { length: 255 }),
  channel_expiry: datetime('channel_expiry', { mode: 'date' }),
  updated_at: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().onUpdateNow(),
});

export type GoogleSettingsRow = typeof googleSettings.$inferSelect;
export type NewGoogleSettings = typeof googleSettings.$inferInsert;
