import AppError from '../pkg/AppError';
import * as issueRepo from '../repositories/issue.repository';
import * as projectRepo from '../repositories/project.repository';
import * as employeeRepo from '../repositories/employee.repository';
import * as notificationPreferenceService from './notificationPreference.service';
import { sendPlatformMail } from '../pkg/mailer';
import {
  uploadIssueAttachmentToMinio,
  streamIssueAttachmentFromMinio,
  deleteIssueAttachmentFromMinio,
} from './minio.service';

type Requester = { id: number; role: string };

const DIFF_FIELDS: { key: string; label: string }[] = [
  { key: 'status', label: 'status' },
  { key: 'priority', label: 'priority' },
  { key: 'type', label: 'type' },
  { key: 'parent_issue_id', label: 'parent' },
  { key: 'story_points', label: 'story_points' },
  { key: 'assignee_id', label: 'assignee' },
  { key: 'module_id', label: 'module' },
  { key: 'due_date', label: 'due_date' },
  { key: 'start_date', label: 'start_date' },
  { key: 'title', label: 'title' },
  { key: 'description', label: 'description' },
];

// Subtasks must nest under one of these; story/task/bug may optionally nest
// under an epic — mirrors Jira's issue-type hierarchy rules.
const SUBTASK_PARENT_TYPES = ['story', 'task', 'bug'];

async function assertValidHierarchy(
  projectId: number | string,
  type: string,
  parentIssueId: number | null | undefined,
) {
  if (!parentIssueId) {
    if (type === 'subtask') throw new AppError('Subtasks require a parent issue', 400);
    return;
  }
  if (type === 'epic') throw new AppError('Epics cannot have a parent issue', 400);

  const parent = await issueRepo.findRawById(parentIssueId);
  if (!parent) throw new AppError('Parent issue not found', 400);
  if (parent.projectId !== Number(projectId)) {
    throw new AppError('Parent issue must be in the same project', 400);
  }

  if (type === 'subtask') {
    if (!SUBTASK_PARENT_TYPES.includes(parent.type)) {
      throw new AppError('Subtasks must belong to a story, task, or bug', 400);
    }
    return;
  }
  if (parent.type !== 'epic') {
    throw new AppError('Only an epic can be the parent of a story, task, or bug', 400);
  }
}

const LINK_LABELS: Record<string, { forward: string; backward: string }> = {
  blocks: { forward: 'blocks', backward: 'is blocked by' },
  relates_to: { forward: 'relates to', backward: 'relates to' },
  duplicates: { forward: 'duplicates', backward: 'is duplicated by' },
};

// admin/member can both write; viewer is read-only; a global admin/lead
// always can regardless of their project-level tier.
async function assertCanWrite(projectId: number | string, requester: Requester) {
  if (requester.role === 'admin' || requester.role === 'lead') return;
  const assignments = await projectRepo.findAssignments(projectId);
  const mine = assignments.find((a: any) => a.employee_id === requester.id);
  if (!mine) throw new AppError('Not allowed to manage issues on this project', 403);
  if (mine.role === 'viewer') throw new AppError('Viewers cannot modify issues on this project', 403);
}

/** label_ids/module_id are FKs into project-scoped tables — the DB only guarantees
 *  the row exists *somewhere*, not that it belongs to this project, so a client could
 *  otherwise attach another project's label or module to this issue. */
async function assertLabelsAndModuleInProject(
  projectId: number | string,
  input: { label_ids?: number[]; module_id?: number | null },
) {
  if (input.label_ids?.length) {
    const projectLabels = await issueRepo.findLabelsByProjectId(projectId);
    const validIds = new Set(projectLabels.map((l: any) => l.id));
    if (input.label_ids.some((id) => !validIds.has(id))) {
      throw new AppError('One or more labels do not belong to this project', 400);
    }
  }
  if (input.module_id) {
    const projectModules = await projectRepo.findModules(projectId);
    if (!projectModules.some((m: any) => m.id === input.module_id)) {
      throw new AppError('Module does not belong to this project', 400);
    }
  }
}

async function assertAssigneeValid(assigneeId: number | null | undefined) {
  if (!assigneeId) return;
  const emp = await employeeRepo.findById(assigneeId);
  if (!emp) throw new AppError('Assignee not found', 400);
  if (emp.status === 'terminated') throw new AppError('Cannot assign to a terminated employee', 400);
}

function assertValidDateRange(startDate: string | null | undefined, dueDate: string | null | undefined) {
  if (startDate && dueDate && startDate > dueDate) {
    throw new AppError('start_date cannot be after due_date', 400);
  }
}

function describeLabelChange(oldIds: number[], newIds: number[], allLabels: { id: number; name: string }[]) {
  const nameOf = (id: number) => allLabels.find((l) => l.id === id)?.name ?? String(id);
  const added = newIds.filter((id) => !oldIds.includes(id)).map(nameOf);
  const removed = oldIds.filter((id) => !newIds.includes(id)).map(nameOf);
  if (!added.length && !removed.length) return null;
  const parts = [];
  if (added.length) parts.push(`+${added.join(', ')}`);
  if (removed.length) parts.push(`-${removed.join(', ')}`);
  return parts.join(' ');
}

// Notification helpers below mirror leave.service.ts's notifyLeaveStatusIfNeeded
// exactly: skip entirely if no mail server is configured, respect the recipient's
// own preference toggle, and never let a mail failure break the actual operation.

async function notifyAssigneeOfAssignment(issueId: number | string, issueTitle: string, assigneeId: number, actorId: number) {
  if (!process.env.MAIL_HOST || assigneeId === actorId) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(assigneeId, 'issue_assigned');
    if (!enabled) return;
    const emp = await employeeRepo.findById(assigneeId);
    if (!emp) return;
    await sendPlatformMail(
      emp.email,
      `HR Platform — Issue Assigned: ${issueTitle}`,
      `<p>Hi ${emp.name},</p>
       <p>You've been assigned to <strong>${issueTitle}</strong> (#${issueId}).</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[issues] Failed to send assignment email for issue ${issueId}:`, err.message);
  }
}

async function notifyAssigneeOfComment(issueId: number | string, issueTitle: string, assigneeId: number, actorId: number) {
  if (!process.env.MAIL_HOST || assigneeId === actorId) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(assigneeId, 'issue_commented');
    if (!enabled) return;
    const emp = await employeeRepo.findById(assigneeId);
    if (!emp) return;
    await sendPlatformMail(
      emp.email,
      `HR Platform — New Comment: ${issueTitle}`,
      `<p>Hi ${emp.name},</p>
       <p>A new comment was added to <strong>${issueTitle}</strong> (#${issueId}), which is assigned to you.</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[issues] Failed to send comment email for issue ${issueId}:`, err.message);
  }
}

async function notifyAssigneeOfStatusChange(issueId: number | string, issueTitle: string, assigneeId: number, actorId: number, newStatus: string) {
  if (!process.env.MAIL_HOST || assigneeId === actorId) return;
  try {
    const enabled = await notificationPreferenceService.isEnabled(assigneeId, 'issue_status_changed');
    if (!enabled) return;
    const emp = await employeeRepo.findById(assigneeId);
    if (!emp) return;
    await sendPlatformMail(
      emp.email,
      `HR Platform — Status Changed: ${issueTitle}`,
      `<p>Hi ${emp.name},</p>
       <p><strong>${issueTitle}</strong> (#${issueId}), assigned to you, is now <strong>${newStatus}</strong>.</p>
       <p style="color:#888;font-size:12px">HR Platform</p>`,
    );
  } catch (err: any) {
    console.error(`[issues] Failed to send status-change email for issue ${issueId}:`, err.message);
  }
}

async function notifyMentionedEmployees(issueId: number | string, issueTitle: string, mentionedIds: number[], actorId: number) {
  if (!process.env.MAIL_HOST) return;
  const recipientIds = mentionedIds.filter((id) => id !== actorId);
  if (!recipientIds.length) return;
  try {
    const recipients = await employeeRepo.findEmailsByIds(recipientIds);
    for (const r of recipients as any[]) {
      const enabled = await notificationPreferenceService.isEnabled(r.id, 'issue_mentioned');
      if (!enabled) continue;
      await sendPlatformMail(
        r.email,
        `HR Platform — You were mentioned: ${issueTitle}`,
        `<p>You were mentioned in a comment on <strong>${issueTitle}</strong> (#${issueId}).</p>
         <p style="color:#888;font-size:12px">HR Platform</p>`,
      );
    }
  } catch (err: any) {
    console.error(`[issues] Failed to send mention email(s) for issue ${issueId}:`, err.message);
  }
}

async function withLabels(rows: any[]) {
  const links = await issueRepo.findLabelLinksForIssues(rows.map((r) => r.id));
  const byIssue = new Map<number, { id: number; name: string; color: string }[]>();
  for (const l of links) {
    const list = byIssue.get(l.issue_id) ?? [];
    list.push({ id: l.label_id, name: l.name, color: l.color });
    byIssue.set(l.issue_id, list);
  }
  return rows.map((r) => ({ ...r, labels: byIssue.get(r.id) ?? [] }));
}

async function withCounts(rows: any[]) {
  const { subIssues, attachments, links } = await issueRepo.findCountsForIssues(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    sub_issues_count: subIssues.get(r.id) ?? 0,
    attachment_count: attachments.get(r.id) ?? 0,
    link_count: links.get(r.id) ?? 0,
  }));
}

export async function list(projectId: number | string) {
  const [rows, code] = await Promise.all([
    issueRepo.findByProjectId(projectId),
    projectRepo.findCodeById(projectId),
  ]);
  const withKeys = rows.map((r: any) => ({ ...r, issue_key: `${code ?? 'ISSUE'}-${r.sequence_number}` }));
  const labeled = await withLabels(withKeys);
  return withCounts(labeled);
}

export async function create(
  projectId: number | string,
  input: {
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    type?: string;
    parent_issue_id?: number | null;
    story_points?: number | null;
    assignee_id?: number | null;
    module_id?: number | null;
    due_date?: string | null;
    start_date?: string | null;
    label_ids?: number[];
  },
  requester: Requester,
) {
  await assertCanWrite(projectId, requester);
  await assertLabelsAndModuleInProject(projectId, input);
  await assertValidHierarchy(projectId, input.type ?? 'task', input.parent_issue_id ?? null);
  await assertAssigneeValid(input.assignee_id);
  assertValidDateRange(input.start_date, input.due_date);
  const id = await issueRepo.create(projectId, input, requester.id);
  if (input.label_ids?.length) await issueRepo.setIssueLabels(id, input.label_ids);
  await issueRepo.logActivity(id, requester.id, 'created');
  if (input.assignee_id) await notifyAssigneeOfAssignment(id, input.title, input.assignee_id, requester.id);
  return id;
}

export async function update(
  issueId: number | string,
  input: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    type?: string;
    parent_issue_id?: number | null;
    story_points?: number | null;
    assignee_id?: number | null;
    module_id?: number | null;
    due_date?: string | null;
    start_date?: string | null;
    label_ids?: number[];
    sort_order?: number;
  },
  requester: Requester,
) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);
  await assertLabelsAndModuleInProject(existing.projectId, input);

  if ('assignee_id' in input) await assertAssigneeValid(input.assignee_id);
  assertValidDateRange(
    'start_date' in input ? input.start_date : existing.startDate,
    'due_date' in input ? input.due_date : existing.dueDate,
  );

  if ('type' in input || 'parent_issue_id' in input) {
    const resolvedType = input.type ?? existing.type;
    const resolvedParentId = 'parent_issue_id' in input ? input.parent_issue_id : existing.parentIssueId;
    if (resolvedParentId && Number(resolvedParentId) === Number(issueId)) {
      throw new AppError('An issue cannot be its own parent', 400);
    }
    await assertValidHierarchy(existing.projectId, resolvedType, resolvedParentId);
  }

  for (const { key, label } of DIFF_FIELDS) {
    if (!(key in input)) continue;
    const oldValue = (existing as any)[toCamel(key)];
    const newValue = (input as any)[key];
    if (String(oldValue ?? '') !== String(newValue ?? '')) {
      const [oldLabel, newLabel] = await Promise.all([
        labelForDiff(key, oldValue, existing.projectId),
        labelForDiff(key, newValue, existing.projectId),
      ]);
      await issueRepo.logActivity(issueId, requester.id, 'updated', label, oldLabel, newLabel);
    }
  }

  // Resolution timestamp follows status automatically — set on the transition
  // into 'done', cleared on the transition back out (reopened), same as Jira's
  // resolutiondate. Never touched when status isn't part of this update at all.
  // Deferred until after the update below actually commits, same reason the
  // notifications are deferred — nothing here should fire on a change that
  // ends up not happening.
  let newCompletedAt: Date | null | undefined;
  let statusChangeNotify: (() => Promise<void>) | undefined;
  if ('status' in input && input.status !== existing.status) {
    if (input.status === 'done') {
      newCompletedAt = new Date();
    } else if (existing.status === 'done') {
      newCompletedAt = null;
    }
    const resolvedAssigneeId = 'assignee_id' in input ? input.assignee_id : existing.assigneeId;
    if (resolvedAssigneeId) {
      statusChangeNotify = () =>
        notifyAssigneeOfStatusChange(issueId, existing.title, resolvedAssigneeId, requester.id, input.status!);
    }
  }

  const assignmentChanged = 'assignee_id' in input && input.assignee_id && input.assignee_id !== existing.assigneeId;

  if (input.label_ids !== undefined) {
    const [currentLinks, projectLabels] = await Promise.all([
      issueRepo.findLabelLinksForIssues([issueId]),
      issueRepo.findLabelsByProjectId(existing.projectId),
    ]);
    const oldLabelIds = currentLinks.map((l: any) => l.label_id);
    const change = describeLabelChange(oldLabelIds, input.label_ids, projectLabels as any);
    if (change) await issueRepo.logActivity(issueId, requester.id, 'updated', 'labels', null, change);
  }

  await issueRepo.update(issueId, input, requester.id);
  if (input.label_ids !== undefined) await issueRepo.setIssueLabels(issueId, input.label_ids);

  // Everything below only fires once the update above has actually committed —
  // a failed write should never be followed by an email claiming it happened.
  if (newCompletedAt !== undefined) await issueRepo.setCompletedAt(issueId, newCompletedAt);
  if (statusChangeNotify) await statusChangeNotify();
  if (assignmentChanged) await notifyAssigneeOfAssignment(issueId, existing.title, input.assignee_id!, requester.id);
}

export async function remove(issueId: number | string, requester: Requester) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);
  await issueRepo.remove(issueId);
}

export async function listComments(issueId: number | string) {
  return issueRepo.findCommentsByIssueId(issueId);
}

export async function addComment(
  issueId: number | string,
  body: string,
  requester: Requester,
  mentionedEmployeeIds?: number[] | null,
) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);

  let validMentionIds: number[] = [];
  if (mentionedEmployeeIds?.length) {
    const uniqueIds = [...new Set(mentionedEmployeeIds)];
    const found = await employeeRepo.findEmailsByIds(uniqueIds);
    const foundIds = new Set(found.map((f: any) => f.id));
    const missing = uniqueIds.filter((i) => !foundIds.has(i));
    if (missing.length) throw new AppError(`Mentioned employee(s) not found: ${missing.join(', ')}`, 400);
    validMentionIds = uniqueIds;
  }

  const id = await issueRepo.addComment(issueId, body, requester.id);
  await issueRepo.logActivity(issueId, requester.id, 'commented', null, null, body);

  if (existing.assigneeId) await notifyAssigneeOfComment(issueId, existing.title, existing.assigneeId, requester.id);
  if (validMentionIds.length) await notifyMentionedEmployees(issueId, existing.title, validMentionIds, requester.id);

  return id;
}

export async function listActivity(issueId: number | string) {
  return issueRepo.findActivityByIssueId(issueId);
}

export async function listLabels(projectId: number | string) {
  return issueRepo.findLabelsByProjectId(projectId);
}

export async function createLabel(projectId: number | string, name: string, color: string, requester: Requester) {
  if (requester.role !== 'admin') throw new AppError('Only admins can manage labels', 403);
  return issueRepo.createLabel(projectId, name, color);
}

export async function removeLabel(projectId: number | string, labelId: number | string, requester: Requester) {
  if (requester.role !== 'admin') throw new AppError('Only admins can manage labels', 403);
  const projectLabels = await issueRepo.findLabelsByProjectId(projectId);
  if (!projectLabels.some((l: any) => l.id === Number(labelId))) {
    throw new AppError('Label not found on this project', 404);
  }
  await issueRepo.removeLabel(labelId);
}

export async function listLinks(issueId: number | string) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  const rows = await issueRepo.findLinksByIssueId(issueId);
  return rows.map((r: any) => ({
    id: r.id,
    link_type: r.link_type,
    label: LINK_LABELS[r.link_type]?.[r.direction as 'forward' | 'backward'] ?? r.link_type,
    other_issue_id: r.direction === 'forward' ? r.linked_issue_id : r.issue_id,
    other_issue_title: r.other_issue_title,
    other_issue_status: r.other_issue_status,
    created_at: r.created_at,
  }));
}

export async function addLink(
  issueId: number | string,
  linkedIssueId: number | string,
  linkType: string,
  requester: Requester,
) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);

  if (Number(linkedIssueId) === Number(issueId)) {
    throw new AppError('Cannot link an issue to itself', 400);
  }
  const target = await issueRepo.findRawById(linkedIssueId);
  if (!target) throw new AppError('Linked issue not found', 400);

  try {
    const id = await issueRepo.createLink(issueId, linkedIssueId, linkType, requester.id);
    await issueRepo.logActivity(issueId, requester.id, 'linked', linkType, null, String(linkedIssueId));
    return id;
  } catch (err: any) {
    // Drizzle wraps driver errors, so the MySQL code lives on err.cause, not err.code.
    const dbErr = err?.code ? err : err?.cause;
    if (dbErr?.code === 'ER_DUP_ENTRY') throw new AppError('This link already exists', 409);
    throw err;
  }
}

export async function removeLink(issueId: number | string, linkId: number | string, requester: Requester) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);

  const link = await issueRepo.findLinkById(linkId);
  if (!link || (link.issueId !== Number(issueId) && link.linkedIssueId !== Number(issueId))) {
    throw new AppError('Link not found on this issue', 404);
  }
  await issueRepo.removeLink(linkId);
}

export async function listAttachments(issueId: number | string) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  return issueRepo.findAttachmentsByIssueId(issueId);
}

export async function addAttachment(
  issueId: number | string,
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  requester: Requester,
) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);

  const objectKey = await uploadIssueAttachmentToMinio(file.buffer, file.mimetype, file.originalname);
  try {
    const id = await issueRepo.createAttachment(
      issueId,
      { objectKey, fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size },
      requester.id,
    );
    await issueRepo.logActivity(issueId, requester.id, 'attached', null, null, file.originalname);
    return id;
  } catch (err) {
    // Roll back the MinIO upload if the DB insert failed, so a half-written
    // row never leaves an orphaned object behind in the bucket.
    await deleteIssueAttachmentFromMinio(objectKey).catch(() => {});
    throw err;
  }
}

export async function removeAttachment(issueId: number | string, attachmentId: number | string, requester: Requester) {
  const existing = await issueRepo.findRawById(issueId);
  if (!existing) throw new AppError('Issue not found', 404);
  await assertCanWrite(existing.projectId, requester);

  const attachment = await issueRepo.findAttachmentById(attachmentId);
  if (!attachment || attachment.issueId !== Number(issueId)) {
    throw new AppError('Attachment not found on this issue', 404);
  }
  await issueRepo.removeAttachment(attachmentId);
  await deleteIssueAttachmentFromMinio(attachment.objectKey).catch(() => {});
}

export async function getAttachmentForDownload(issueId: number | string, attachmentId: number | string) {
  const attachment = await issueRepo.findAttachmentById(attachmentId);
  if (!attachment || attachment.issueId !== Number(issueId)) {
    throw new AppError('Attachment not found on this issue', 404);
  }
  const { stream, size, contentType } = await streamIssueAttachmentFromMinio(attachment.objectKey);
  return { stream, size, contentType, fileName: attachment.fileName };
}

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function stringify(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

// assignee/parent/module are foreign keys — logging the raw id in the
// activity feed ("changed assignee from 12 to 45") is meaningless to a
// reader, so these three resolve to the referenced row's name instead.
async function labelForDiff(key: string, value: unknown, projectId: number | string): Promise<string | null> {
  if (value === null || value === undefined) return null;
  if (key === 'assignee_id') {
    const emp = await employeeRepo.findNameById(value as number);
    return emp?.name ?? String(value);
  }
  if (key === 'parent_issue_id') {
    const parent = await issueRepo.findRawById(value as number);
    return parent?.title ?? String(value);
  }
  if (key === 'module_id') {
    const projectModules = await projectRepo.findModules(projectId);
    const mod = projectModules.find((m: any) => m.id === value);
    return mod?.name ?? String(value);
  }
  return stringify(value);
}
