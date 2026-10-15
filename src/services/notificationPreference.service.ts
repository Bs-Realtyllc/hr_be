import * as notificationPreferenceRepo from '../repositories/notificationPreference.repository';
import { NOTIFICATION_TYPES, isValidNotificationType, isRelevantToRole, type NotificationType } from '../pkg/notificationTypes';
import AppError from '../pkg/AppError';

export async function getPreferences(employeeId: number, role: string) {
  const stored = await notificationPreferenceRepo.findAllForEmployee(employeeId);
  const overrides = new Map(stored.map((row) => [row.notification_type, row.enabled]));

  return NOTIFICATION_TYPES.filter((type) => isRelevantToRole(type, role)).map((type) => ({
    type: type.key,
    group: type.group,
    label: type.label,
    enabled: overrides.has(type.key) ? overrides.get(type.key) : true,
  }));
}

export async function updatePreferences(
  employeeId: number,
  role: string,
  updates: { type: string; enabled: boolean }[],
  actorId: number | null,
) {
  for (const { type } of updates) {
    if (!isValidNotificationType(type)) {
      throw new AppError(`Unknown notification type: ${type}`, 400);
    }
    const definition = NOTIFICATION_TYPES.find((t) => t.key === type)!;
    if (!isRelevantToRole(definition, role)) {
      throw new AppError(`Notification type "${type}" does not apply to your role`, 400);
    }
  }

  for (const { type, enabled } of updates) {
    await notificationPreferenceRepo.upsert(employeeId, type, enabled, actorId);
  }
}

// Every notification-sending call site checks this before emailing — defaults
// to enabled so notifications work out of the box without a seeded row per employee.
export async function isEnabled(employeeId: number, type: NotificationType): Promise<boolean> {
  const row = await notificationPreferenceRepo.findOne(employeeId, type);
  return row ? row.enabled : true;
}
