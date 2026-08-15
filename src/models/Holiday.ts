import { mysqlTable, varchar, text, date, year } from 'drizzle-orm/mysql-core';
import { baseColumns } from './BaseModel';

export const holidays = mysqlTable('holidays', {
  ...baseColumns,
  name: varchar('name', { length: 150 }).notNull(),
  message: text('message'),
  holiday_date: date('holiday_date', { mode: 'string' }).notNull().unique(),
  year: year('year').notNull(),
});

export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
