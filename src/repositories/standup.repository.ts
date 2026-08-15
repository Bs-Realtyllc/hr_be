import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { standups, employeesFlat } from '../models';

// Same exported function names/signatures as the old src/models/Standup.js.

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const author = alias(employeesFlat, 'standup_author');

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
      designation: author.designation,
      profile_picture: author.profile_picture,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employee_id, author.id))
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
      designation: author.designation,
      profile_picture: author.profile_picture,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employee_id, author.id))
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
      // `id = LAST_INSERT_ID(id)` is the standard MySQL idiom for making
      // insertId resolve to the existing row's id on the UPDATE branch too —
      // without it, insertId comes back 0 when today's standup already
      // existed and this just updated it.
      set: { id: sql`LAST_INSERT_ID(id)`, yesterday, today, blockers, updated_by: actorId },
    });
  return insertedId(result);
}
