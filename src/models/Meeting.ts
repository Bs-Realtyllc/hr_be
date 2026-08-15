import { mysqlTable, int, varchar, text, datetime, json, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const meetings = mysqlTable('meetings', {
  ...baseColumns,
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  start_datetime: datetime('start_datetime', { mode: 'string' }).notNull(),
  end_datetime: datetime('end_datetime', { mode: 'string' }).notNull(),
  attendees: json('attendees').$type<string[]>(),
  google_event_id: varchar('google_event_id', { length: 255 }).unique(),
  meet_link: varchar('meet_link', { length: 500 }),
  status: mysqlEnum('status', ['scheduled', 'cancelled']).notNull().default('scheduled'),
});

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
