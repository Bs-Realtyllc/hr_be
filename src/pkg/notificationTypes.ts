// Single source of truth for which notification types exist and which roles
// should see/set each one in the preferences API/UI.
const ALL_ROLES = ['admin', 'lead', 'employee', 'intern'] as const;
const REQUESTER_ROLES = ['employee', 'intern'] as const;
const APPROVER_ROLES = ['lead'] as const;

export const NOTIFICATION_TYPES = [
  { key: 'new_login_detected', group: 'security', label: 'New Login Detected', roles: ALL_ROLES,
    description: 'Email me when my account is signed into from a device or location not seen before.' },
  { key: 'password_changed', group: 'security', label: 'Password Changed', roles: ALL_ROLES,
    description: 'Email me a confirmation whenever my account password is changed.' },
  { key: 'employee_updates', group: 'email', label: 'Role, Department & Salary Changes', roles: ALL_ROLES,
    description: 'Email me whenever my own designation, department, or salary/pay details are updated by an admin.' },
  { key: 'leave_request', group: 'email', label: 'Leave Request Status', roles: REQUESTER_ROLES,
    description: 'Email me when a leave request I submitted is approved or rejected.' },
  { key: 'overtime_request', group: 'email', label: 'Overtime Request Status', roles: REQUESTER_ROLES,
    description: 'Email me when an overtime request I submitted is approved or rejected.' },
  { key: 'documents_signature', group: 'email', label: 'Signed Document Rejected', roles: REQUESTER_ROLES,
    description: 'Email me if a signed document I submitted gets rejected and needs to be corrected.' },
  { key: 'onboarding_updated', group: 'email', label: 'Onboarding Updated', roles: REQUESTER_ROLES,
    description: 'Email me when there is an update to my onboarding process.' },
  { key: 'offboarding_updated', group: 'email', label: 'Offboarding Updated', roles: REQUESTER_ROLES,
    description: 'Email me when there is an update to my offboarding process.' },
  // Approver alerts only ever get sent to the requester's assigned lead
  // (see leave.service.ts / overtime.service.ts) — admins never receive
  // these, so the toggle is hidden from admin to avoid a dead setting.
  { key: 'leave_request_submitted', group: 'email', label: 'New Leave Request to Review', roles: APPROVER_ROLES,
    description: 'Email me whenever any employee or intern submits a leave request that needs my review.' },
  { key: 'overtime_request_submitted', group: 'email', label: 'New Overtime Request to Review', roles: APPROVER_ROLES,
    description: 'Email me whenever any employee or intern submits an overtime request that needs my review.' },
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number]['key'];

const VALID_KEYS = new Set<string>(NOTIFICATION_TYPES.map((t) => t.key));

export function isValidNotificationType(key: string): key is NotificationType {
  return VALID_KEYS.has(key);
}

export function isRelevantToRole(type: typeof NOTIFICATION_TYPES[number], role: string): boolean {
  return (type.roles as readonly string[]).includes(role);
}
