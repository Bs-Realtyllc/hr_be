import { eq, and, inArray, asc, desc, sql, count } from 'drizzle-orm';
import { db } from '../config/database';
import { DEFAULT_COMPANY_ID } from '../config/company';
import { issues, issueLabels, issueLabelLinks, issueComments, issueActivity, issueLinks, issueAttachments, projects, employees } from '../../drizzle/schema';

const issuesColumns = {
  id: issues.id,
  project_id: issues.projectId,
  title: issues.title,
  description: issues.description,
  status: issues.status,
  priority: issues.priority,
  type: issues.type,
  parent_issue_id: issues.parentIssueId,
  story_points: issues.storyPoints,
  sequence_number: issues.sequenceNumber,
  assignee_id: issues.assigneeId,
  assignee_name: employees.name,
  module_id: issues.moduleId,
  due_date: issues.dueDate,
  start_date: issues.startDate,
  completed_at: issues.completedAt,
  sort_order: issues.sortOrder,
  created_by: issues.createdBy,
  updated_by: issues.updatedBy,
  created_at: issues.createdAt,
  updated_at: issues.updatedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findByProjectId(projectId: number | string) {
  return db
    .select(issuesColumns)
    .from(issues)
    .leftJoin(employees, eq(issues.assigneeId, employees.id))
    .where(eq(issues.projectId, Number(projectId)))
    .orderBy(asc(issues.sortOrder), asc(issues.createdAt))
    // Safety cap, not pagination — a board UI isn't built to page through
    // results, this just stops one project's query from becoming unbounded.
    .limit(500);
}

// Links are stored on whichever side created them (see findLinksByIssueId's
// forward/backward split), so a link count has to sum both directions.
export async function findCountsForIssues(issueIds: number[]) {
  if (issueIds.length === 0) {
    return { subIssues: new Map<number, number>(), attachments: new Map<number, number>(), links: new Map<number, number>() };
  }

  const [subIssueRows, attachmentRows, linkForwardRows, linkBackwardRows] = await Promise.all([
    db.select({ id: issues.parentIssueId, count: count() })
      .from(issues)
      .where(inArray(issues.parentIssueId, issueIds))
      .groupBy(issues.parentIssueId),
    db.select({ id: issueAttachments.issueId, count: count() })
      .from(issueAttachments)
      .where(inArray(issueAttachments.issueId, issueIds))
      .groupBy(issueAttachments.issueId),
    db.select({ id: issueLinks.issueId, count: count() })
      .from(issueLinks)
      .where(inArray(issueLinks.issueId, issueIds))
      .groupBy(issueLinks.issueId),
    db.select({ id: issueLinks.linkedIssueId, count: count() })
      .from(issueLinks)
      .where(inArray(issueLinks.linkedIssueId, issueIds))
      .groupBy(issueLinks.linkedIssueId),
  ]);

  const links = new Map<number, number>();
  for (const r of [...linkForwardRows, ...linkBackwardRows]) {
    links.set(r.id as number, (links.get(r.id as number) ?? 0) + r.count);
  }

  return {
    subIssues: new Map(subIssueRows.map((r) => [r.id as number, r.count])),
    attachments: new Map(attachmentRows.map((r) => [r.id, r.count])),
    links,
  };
}

export async function findById(issueId: number | string) {
  const rows = await db
    .select(issuesColumns)
    .from(issues)
    .leftJoin(employees, eq(issues.assigneeId, employees.id))
    .where(eq(issues.id, Number(issueId)));
  return rows[0] ?? null;
}

/** Raw row (no join) — used internally for diffing against an update payload. */
export async function findRawById(issueId: number | string) {
  const rows = await db
    .select()
    .from(issues)
    .where(and(eq(issues.id, Number(issueId)), eq(issues.companyId, DEFAULT_COMPANY_ID)));
  return rows[0] ?? null;
}

export async function create(
  projectId: number | string,
  data: {
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
    sort_order?: number;
  },
  actorId: number | null = null,
) {
  // Atomic: increment the project's counter and read the new value back in
  // the same transaction, so two concurrent creates can never land on the
  // same sequence_number — a plain SELECT MAX()+1 would race.
  return db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({ issueCounter: sql`${projects.issueCounter} + 1` })
      .where(eq(projects.id, Number(projectId)));
    const [proj] = await tx
      .select({ issueCounter: projects.issueCounter })
      .from(projects)
      .where(eq(projects.id, Number(projectId)));

    const result = await tx.insert(issues).values({
      projectId: Number(projectId),
      title: data.title,
      description: data.description ?? null,
      status: (data.status as any) ?? 'backlog',
      priority: (data.priority as any) ?? 'none',
      type: (data.type as any) ?? 'task',
      parentIssueId: data.parent_issue_id ?? null,
      storyPoints: data.story_points ?? null,
      sequenceNumber: proj.issueCounter,
      assigneeId: data.assignee_id ?? null,
      moduleId: data.module_id ?? null,
      dueDate: data.due_date ?? null,
      startDate: data.start_date ?? null,
      sortOrder: data.sort_order ?? 0,
      createdBy: actorId,
      updatedBy: actorId,
    } as any);
    return insertedId(result);
  });
}

export async function update(
  issueId: number | string,
  data: {
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
    sort_order?: number;
  },
  actorId: number | null = null,
) {
  await db
    .update(issues)
    .set({
      title: data.title,
      description: data.description,
      status: data.status as any,
      priority: data.priority as any,
      type: data.type as any,
      parentIssueId: data.parent_issue_id,
      storyPoints: data.story_points,
      assigneeId: data.assignee_id,
      moduleId: data.module_id,
      dueDate: data.due_date,
      startDate: data.start_date,
      sortOrder: data.sort_order,
      updatedBy: actorId,
    })
    .where(eq(issues.id, Number(issueId)));
}

/** Auto-managed resolution timestamp — set/cleared by the service layer on
 *  status transitions into/out of 'done', never via the generic update() above. */
export async function setCompletedAt(issueId: number | string, completedAt: Date | null) {
  await db.update(issues).set({ completedAt }).where(eq(issues.id, Number(issueId)));
}

export async function remove(issueId: number | string) {
  await db.delete(issues).where(eq(issues.id, Number(issueId)));
}

// --- Labels ---

export async function findLabelsByProjectId(projectId: number | string) {
  return db.select().from(issueLabels).where(eq(issueLabels.projectId, Number(projectId))).orderBy(asc(issueLabels.name));
}

export async function createLabel(projectId: number | string, name: string, color: string) {
  const result = await db.insert(issueLabels).values({ projectId: Number(projectId), name, color });
  return insertedId(result);
}

export async function removeLabel(labelId: number | string) {
  await db.delete(issueLabels).where(eq(issueLabels.id, Number(labelId)));
}

export async function findLabelLinksForIssues(issueIds: (number | string)[]) {
  if (!issueIds.length) return [];
  return db
    .select({
      issue_id: issueLabelLinks.issueId,
      label_id: issueLabels.id,
      name: issueLabels.name,
      color: issueLabels.color,
    })
    .from(issueLabelLinks)
    .innerJoin(issueLabels, eq(issueLabelLinks.labelId, issueLabels.id))
    .where(inArray(issueLabelLinks.issueId, issueIds.map(Number)));
}

export async function setIssueLabels(issueId: number | string, labelIds: number[]) {
  await db.delete(issueLabelLinks).where(eq(issueLabelLinks.issueId, Number(issueId)));
  if (!labelIds.length) return;
  await db.insert(issueLabelLinks).values(labelIds.map((labelId) => ({ issueId: Number(issueId), labelId })));
}

// --- Comments ---

export async function findCommentsByIssueId(issueId: number | string) {
  return db
    .select({
      id: issueComments.id,
      issue_id: issueComments.issueId,
      body: issueComments.body,
      created_by: issueComments.createdBy,
      created_by_name: employees.name,
      created_at: issueComments.createdAt,
    })
    .from(issueComments)
    .leftJoin(employees, eq(issueComments.createdBy, employees.id))
    .where(eq(issueComments.issueId, Number(issueId)))
    .orderBy(asc(issueComments.createdAt));
}

export async function addComment(issueId: number | string, body: string, actorId: number | null) {
  const result = await db.insert(issueComments).values({ issueId: Number(issueId), body, createdBy: actorId });
  return insertedId(result);
}

// --- Activity ---

export async function findActivityByIssueId(issueId: number | string) {
  return db
    .select({
      id: issueActivity.id,
      issue_id: issueActivity.issueId,
      actor_id: issueActivity.actorId,
      actor_name: employees.name,
      verb: issueActivity.verb,
      field: issueActivity.field,
      old_value: issueActivity.oldValue,
      new_value: issueActivity.newValue,
      created_at: issueActivity.createdAt,
    })
    .from(issueActivity)
    .leftJoin(employees, eq(issueActivity.actorId, employees.id))
    .where(eq(issueActivity.issueId, Number(issueId)))
    .orderBy(desc(issueActivity.createdAt));
}

export async function logActivity(
  issueId: number | string,
  actorId: number | null,
  verb: string,
  field?: string | null,
  oldValue?: string | null,
  newValue?: string | null,
) {
  await db.insert(issueActivity).values({
    issueId: Number(issueId),
    actorId,
    verb,
    field: field ?? null,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
}

// --- Links ---

const linkColumns = {
  id: issueLinks.id,
  issue_id: issueLinks.issueId,
  linked_issue_id: issueLinks.linkedIssueId,
  link_type: issueLinks.linkType,
  created_at: issueLinks.createdAt,
  other_issue_title: issues.title,
  other_issue_status: issues.status,
};

/** Links where this issue is the source (e.g. "this issue blocks ...") plus
 *  links where it's the target (e.g. "... blocks this issue"), tagged with
 *  `direction` so the service can resolve the right label for each side. */
export async function findLinksByIssueId(issueId: number | string) {
  const id = Number(issueId);

  const forward = await db
    .select(linkColumns)
    .from(issueLinks)
    .innerJoin(issues, eq(issueLinks.linkedIssueId, issues.id))
    .where(eq(issueLinks.issueId, id));

  const backward = await db
    .select(linkColumns)
    .from(issueLinks)
    .innerJoin(issues, eq(issueLinks.issueId, issues.id))
    .where(eq(issueLinks.linkedIssueId, id));

  return [
    ...forward.map((r) => ({ ...r, direction: 'forward' as const })),
    ...backward.map((r) => ({ ...r, direction: 'backward' as const })),
  ];
}

export async function createLink(
  issueId: number | string,
  linkedIssueId: number | string,
  linkType: string,
  actorId: number | null,
) {
  const result = await db.insert(issueLinks).values({
    issueId: Number(issueId),
    linkedIssueId: Number(linkedIssueId),
    linkType: linkType as any,
    createdBy: actorId,
  });
  return insertedId(result);
}

export async function findLinkById(linkId: number | string) {
  const rows = await db.select().from(issueLinks).where(eq(issueLinks.id, Number(linkId)));
  return rows[0] ?? null;
}

export async function removeLink(linkId: number | string) {
  await db.delete(issueLinks).where(eq(issueLinks.id, Number(linkId)));
}

// --- Attachments ---

export async function findAttachmentsByIssueId(issueId: number | string) {
  return db
    .select({
      id: issueAttachments.id,
      issue_id: issueAttachments.issueId,
      object_key: issueAttachments.objectKey,
      file_name: issueAttachments.fileName,
      mime_type: issueAttachments.mimeType,
      file_size: issueAttachments.fileSize,
      uploaded_by: issueAttachments.uploadedBy,
      uploaded_by_name: employees.name,
      created_at: issueAttachments.createdAt,
    })
    .from(issueAttachments)
    .leftJoin(employees, eq(issueAttachments.uploadedBy, employees.id))
    .where(eq(issueAttachments.issueId, Number(issueId)))
    .orderBy(desc(issueAttachments.createdAt));
}

export async function createAttachment(
  issueId: number | string,
  data: { objectKey: string; fileName: string; mimeType: string; fileSize: number },
  actorId: number | null,
) {
  const result = await db.insert(issueAttachments).values({
    issueId: Number(issueId),
    objectKey: data.objectKey,
    fileName: data.fileName,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    uploadedBy: actorId,
  });
  return insertedId(result);
}

export async function findAttachmentById(attachmentId: number | string) {
  const rows = await db.select().from(issueAttachments).where(eq(issueAttachments.id, Number(attachmentId)));
  return rows[0] ?? null;
}

export async function removeAttachment(attachmentId: number | string) {
  await db.delete(issueAttachments).where(eq(issueAttachments.id, Number(attachmentId)));
}
