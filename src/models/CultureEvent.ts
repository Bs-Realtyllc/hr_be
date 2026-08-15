import { mysqlTable, int, varchar, date, text, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const cultureEvents = mysqlTable('culture_events', {
  ...baseColumns,
  title: varchar('title', { length: 200 }).notNull(),
  event_type: mysqlEnum('event_type', ['birthday', 'anniversary', 'team_event', 'milestone']).notNull(),
  employee_id: int('employee_id'),
  event_date: date('event_date', { mode: 'string' }).notNull(),
  description: text('description'),
  slack_notified: boolean('slack_notified').default(false),
});

export type CultureEvent = typeof cultureEvents.$inferSelect;
export type NewCultureEvent = typeof cultureEvents.$inferInsert;
