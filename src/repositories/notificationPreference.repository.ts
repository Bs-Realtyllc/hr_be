import { and, eq } from 'drizzle-orm';
import { db } from '../config/database';
import { notificationPreferences } from '../models';

export async function findAllForEmployee(employeeId: number) {
  return db
    .select({ notification_type: notificationPreferences.notification_type, enabled: notificationPreferences.enabled })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.employee_id, employeeId));
}

export async function findOne(employeeId: number, notificationType: string) {
  const rows = await db
    .select({ enabled: notificationPreferences.enabled })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.employee_id, employeeId),
        eq(notificationPreferences.notification_type, notificationType),
      ),
    )
    .limit(1);
  return rows[0] || null;
}

export async function upsert(employeeId: number, notificationType: string, enabled: boolean, actorId: number | null) {
  await db
    .insert(notificationPreferences)
    .values({ employee_id: employeeId, notification_type: notificationType, enabled, created_by: actorId })
    .onDuplicateKeyUpdate({ set: { enabled, updated_by: actorId } });
}
