import { and, eq } from 'drizzle-orm';
import { db } from '../config/database';
import { notificationPreferences } from '../../drizzle/schema';

export async function findAllForEmployee(employeeId: number) {
  return db
    .select({ notification_type: notificationPreferences.notificationType, enabled: notificationPreferences.enabled })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.employeeId, employeeId));
}

export async function findOne(employeeId: number, notificationType: string) {
  const rows = await db
    .select({ enabled: notificationPreferences.enabled })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.employeeId, employeeId),
        eq(notificationPreferences.notificationType, notificationType),
      ),
    )
    .limit(1);
  return rows[0] || null;
}

export async function upsert(employeeId: number, notificationType: string, enabled: boolean, actorId: number | null) {
  await db
    .insert(notificationPreferences)
    .values({ employeeId, notificationType, enabled, createdBy: actorId })
    .onDuplicateKeyUpdate({ set: { enabled, updatedBy: actorId } });
}
