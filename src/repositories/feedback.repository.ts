import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { feedbackNotes, employees, designations, projects } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const sender = alias(employees, 'fb_from');
const recipient = alias(employees, 'fb_to');
const senderDesignation = alias(designations, 'fb_from_desig');
const recipientDesignation = alias(designations, 'fb_to_desig');

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
  if (scope === 'received') conditions.push(eq(feedbackNotes.to_employee_id, Number(employeeId)));
  if (scope === 'sent') conditions.push(eq(feedbackNotes.from_employee_id, Number(employeeId)));
  if (scope === 'public') conditions.push(eq(feedbackNotes.visibility, 'public'));
  if (type) conditions.push(eq(feedbackNotes.feedback_type, type as any));

  return db
    .select({
      ...getTableColumns(feedbackNotes),
      from_name: sender.name,
      from_designation: senderDesignation.title,
      to_name: recipient.name,
      to_designation: recipientDesignation.title,
      project_name: projects.name,
    })
    .from(feedbackNotes)
    .innerJoin(sender, eq(feedbackNotes.from_employee_id, sender.id))
    .leftJoin(senderDesignation, eq(sender.designation_id, senderDesignation.id))
    .innerJoin(recipient, eq(feedbackNotes.to_employee_id, recipient.id))
    .leftJoin(recipientDesignation, eq(recipient.designation_id, recipientDesignation.id))
    .leftJoin(projects, eq(feedbackNotes.project_id, projects.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(feedbackNotes.created_at))
    .limit(200);
}

export async function findById(id: number | string) {
  const rows = await db.select().from(feedbackNotes).where(eq(feedbackNotes.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: any) {
  const result = await db.insert(feedbackNotes).values({
    from_employee_id: data.from_employee_id,
    to_employee_id: data.to_employee_id,
    feedback_type: data.feedback_type,
    visibility: data.visibility,
    message: data.message,
    project_id: data.project_id,
    created_at: new Date(),
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
