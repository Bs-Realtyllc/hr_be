import { mysqlTable, int, varchar, boolean, unique } from 'drizzle-orm/mysql-core';
import { auditColumns } from './BaseModel';

export const notificationPreferences = mysqlTable('notification_preferences', {
  id: int('id').autoincrement().primaryKey(),
  employee_id: int('employee_id').notNull(),
  notification_type: varchar('notification_type', { length: 64 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),
  ...auditColumns,
}, (table) => ({
  uqEmployeeType: unique('uq_notification_preferences_employee_type').on(table.employee_id, table.notification_type),
}));

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
