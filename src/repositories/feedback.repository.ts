import { eq, and, sql, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { feedbackNotes, employees, positions, projects } from '../../drizzle/schema';

const feedbackNotesColumns = {
  id: feedbackNotes.id,
  from_employee_id: feedbackNotes.fromEmployeeId,
  to_employee_id: feedbackNotes.toEmployeeId,
  feedback_type: feedbackNotes.feedbackType,
  visibility: feedbackNotes.visibility,
  message: feedbackNotes.message,
  project_id: feedbackNotes.projectId,
  created_at: feedbackNotes.createdAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const sender = alias(employees, 'fb_from');
const recipient = alias(employees, 'fb_to');
const senderPosition = alias(positions, 'fb_from_pos');
const recipientPosition = alias(positions, 'fb_to_pos');

export async function findFeed({
  scope,
  employeeId,
  type,
}: {
  scope?: string;
  employeeId?: number | string;
  type?: string;
}) {
  const conditions = [];
  if (scope === 'received') conditions.push(eq(feedbackNotes.toEmployeeId, Number(employeeId)));
  if (scope === 'sent') conditions.push(eq(feedbackNotes.fromEmployeeId, Number(employeeId)));
  if (scope === 'public') conditions.push(eq(feedbackNotes.visibility, 'public'));
  if (type) conditions.push(eq(feedbackNotes.feedbackType, type as any));

  return db
    .select({
      ...feedbackNotesColumns,
      from_name: sender.name,
      from_designation: senderPosition.title,
      to_name: recipient.name,
      to_designation: recipientPosition.title,
      project_name: projects.name,
    })
    .from(feedbackNotes)
    .innerJoin(sender, eq(feedbackNotes.fromEmployeeId, sender.id))
    .leftJoin(senderPosition as any, eq(sender.positionId, senderPosition.id))
    .innerJoin(recipient, eq(feedbackNotes.toEmployeeId, recipient.id))
    .leftJoin(recipientPosition as any, eq(recipient.positionId, recipientPosition.id))
    .leftJoin(projects, eq(feedbackNotes.projectId, projects.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(feedbackNotes.createdAt))
    .limit(200);
}

export async function findById(id: number | string) {
  const rows = await db.select(feedbackNotesColumns).from(feedbackNotes).where(eq(feedbackNotes.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: any) {
  const result = await db.insert(feedbackNotes).values({
    fromEmployeeId: data.from_employee_id,
    toEmployeeId: data.to_employee_id,
    feedbackType: data.feedback_type,
    visibility: data.visibility,
    message: data.message,
    projectId: data.project_id,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function remove(id: number | string) {
  await db.delete(feedbackNotes).where(eq(feedbackNotes.id, Number(id)));
}

export async function summaryReceivedByEmployee() {
  const result: any = await db.execute(sql`
    SELECT e.id AS employee_id, e.name AS employee_name,
           COUNT(f.id) AS total_received,
           SUM(f.feedback_type = 'praise') AS praise_count,
           SUM(f.feedback_type = 'constructive') AS constructive_count
    FROM employees e
    LEFT JOIN feedback_notes f ON f.to_employee_id = e.id
    WHERE e.status NOT IN ('onboarding', 'terminated')
    GROUP BY e.id, e.name
    HAVING total_received > 0
    ORDER BY total_received DESC
  `);
  return result[0] as any[];
}
