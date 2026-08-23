import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { standups, employees, designations, employeeDocuments } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const author = alias(employees, 'standup_author');
const authorDesignation = alias(designations, 'standup_author_desig');
const authorDoc = alias(employeeDocuments, 'standup_author_doc');

export async function findWithNames({
  employeeId,
  date,
  startDate,
  endDate,
}: {
  employeeId?: number | string;
  date?: string;
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [];
  if (employeeId) conditions.push(eq(standups.employee_id, Number(employeeId)));
  if (date) {
    conditions.push(eq(standups.standup_date, date));
  } else {
    if (startDate) conditions.push(gte(standups.standup_date, startDate));
    if (endDate) conditions.push(lte(standups.standup_date, endDate));
  }

  return db
    .select({
      id: standups.id,
      employee_id: standups.employee_id,
      yesterday: standups.yesterday,
      today: standups.today,
      blockers: standups.blockers,
      standup_date: standups.standup_date,
      created_at: standups.created_at,
      employee_name: author.name,
      designation: authorDesignation.title,
      profile_picture: authorDoc.filename,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employee_id, author.id))
    .leftJoin(authorDesignation, eq(author.designation_id, authorDesignation.id))
    .leftJoin(authorDoc, and(eq(authorDoc.emp_id, author.id), eq(authorDoc.name, 'profile_picture')))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(standups.standup_date), desc(standups.created_at))
    .limit(200);
}

export async function findToday(today: string, employeeId?: number | string) {
  const conditions = [eq(standups.standup_date, today)];
  if (employeeId) conditions.push(eq(standups.employee_id, Number(employeeId)));

  return db
    .select({
      id: standups.id,
      employee_id: standups.employee_id,
      yesterday: standups.yesterday,
      today: standups.today,
      blockers: standups.blockers,
      standup_date: standups.standup_date,
      created_at: standups.created_at,
      employee_name: author.name,
      designation: authorDesignation.title,
      profile_picture: authorDoc.filename,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employee_id, author.id))
    .leftJoin(authorDesignation, eq(author.designation_id, authorDesignation.id))
    .leftJoin(authorDoc, and(eq(authorDoc.emp_id, author.id), eq(authorDoc.name, 'profile_picture')))
    .where(and(...conditions))
    .orderBy(desc(standups.created_at));
}

export async function upsert(
  { employee_id, yesterday, today, blockers, standup_date }: any,
  actorId: number | null = null
) {
  const date = standup_date || new Date().toISOString().split('T')[0];
  const result = await db
    .insert(standups)
    .values({
      employee_id,
      yesterday,
      today,
      blockers,
      standup_date: date,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date(),
    } as any)
    .onDuplicateKeyUpdate({
      set: { id: sql`LAST_INSERT_ID(id)`, yesterday, today, blockers, updated_by: actorId },
    });
  return insertedId(result);
}
