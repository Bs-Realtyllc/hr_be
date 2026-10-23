// Single source of truth for which notification types exist and which roles
// should see/set each one in the preferences API/UI.
const ALL_ROLES = ['admin', 'lead', 'employee', 'intern'] as const;
const REQUESTER_ROLES = ['employee', 'intern'] as const;
const APPROVER_ROLES = ['lead'] as const;

export const NOTIFICATION_TYPES = [
  { key: 'new_login_detected', group: 'security', label: 'New Login Detected', roles: ALL_ROLES },
  { key: 'password_changed', group: 'security', label: 'Password Changed', roles: ALL_ROLES },
  { key: 'employee_updates', group: 'email', label: 'Employee Updates', roles: ALL_ROLES },
  { key: 'leave_request', group: 'email', label: 'Leave Request', roles: REQUESTER_ROLES },
  { key: 'overtime_request', group: 'email', label: 'Overtime Request', roles: REQUESTER_ROLES },
  { key: 'documents_signature', group: 'email', label: 'Documents & Signature Request', roles: REQUESTER_ROLES },
  { key: 'onboarding_updated', group: 'email', label: 'Onboarding Updated', roles: REQUESTER_ROLES },
  // Approver alerts only ever get sent to the requester's assigned lead
  // (see leave.service.ts / overtime.service.ts) — admins never receive
  // these, so the toggle is hidden from admin to avoid a dead setting.
  { key: 'leave_request_submitted', group: 'email', label: 'Leave Request Submitted', roles: APPROVER_ROLES },
  { key: 'overtime_request_submitted', group: 'email', label: 'Overtime Request Submitted', roles: APPROVER_ROLES },
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number]['key'];

const VALID_KEYS = new Set<string>(NOTIFICATION_TYPES.map((t) => t.key));

export function isValidNotificationType(key: string): key is NotificationType {
  return VALID_KEYS.has(key);
}

export function isRelevantToRole(type: typeof NOTIFICATION_TYPES[number], role: string): boolean {
  return (type.roles as readonly string[]).includes(role);
}
