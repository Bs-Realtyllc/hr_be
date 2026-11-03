import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../config/database";
import {
  standups,
  employees,
  designations,
  employeeDocuments,
} from "../../drizzle/schema";

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const author = alias(employees, "standup_author");
const authorDesignation = alias(designations, "standup_author_desig");
const authorDoc = alias(employeeDocuments, "standup_author_doc");

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
  if (employeeId) conditions.push(eq(standups.employeeId, Number(employeeId)));
  if (date) {
    conditions.push(eq(standups.standupDate, date));
  } else {
    if (startDate) conditions.push(gte(standups.standupDate, startDate));
    if (endDate) conditions.push(lte(standups.standupDate, endDate));
  }

  return db
    .select({
      id: standups.id,
      employee_id: standups.employeeId,
      workedOn: standups.workedOn,
      completed: standups.completed,
      inProgress: standups.inProgress,
      nextUp: standups.nextUp,
      blockers: standups.blockers,
      links: standups.links,
      standup_date: standups.standupDate,
      created_at: standups.createdAt,
      employee_name: author.name,
      designation: authorDesignation.title,
      profile_picture: authorDoc.filename,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employeeId, author.id))
    .leftJoin(
      authorDesignation,
      eq(author.designationId, authorDesignation.id),
    )
    .leftJoin(
      authorDoc,
      and(
        eq(authorDoc.empId, author.id),
        eq(authorDoc.name, "profile_picture"),
      ),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(standups.standupDate), desc(standups.createdAt))
    .limit(200);
}

export async function findToday(today: string, employeeId?: number | string) {
  const conditions = [eq(standups.standupDate, today)];
  if (employeeId) conditions.push(eq(standups.employeeId, Number(employeeId)));

  return db
    .select({
      id: standups.id,
      employee_id: standups.employeeId,
      workedOn: standups.workedOn,
      completed: standups.completed,
      inProgress: standups.inProgress,
      nextUp: standups.nextUp,
      blockers: standups.blockers,
      links: standups.links,
      standup_date: standups.standupDate,
      created_at: standups.createdAt,
      employee_name: author.name,
      designation: authorDesignation.title,
      profile_picture: authorDoc.filename,
    })
    .from(standups)
    .innerJoin(author, eq(standups.employeeId, author.id))
    .leftJoin(
      authorDesignation,
      eq(author.designationId, authorDesignation.id),
    )
    .leftJoin(
      authorDoc,
      and(
        eq(authorDoc.empId, author.id),
        eq(authorDoc.name, "profile_picture"),
      ),
    )
    .where(and(...conditions))
    .orderBy(desc(standups.createdAt));
}

export async function upsert(
  {
    employee_id,
    workedOn,
    completed,
    inProgress,
    nextUp,
    blockers,
    links,
    standup_date,
  }: any,
  actorId: number | null = null,
) {
  const date = standup_date || new Date().toISOString().split("T")[0];
  const result = await db
    .insert(standups)
    .values({
      employeeId: employee_id,
      workedOn,
      completed,
      inProgress,
      nextUp,
      blockers,
      links,
      standupDate: date,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        id: sql`LAST_INSERT_ID(id)`,
        workedOn,
        completed,
        inProgress,
        nextUp,
        blockers,
        links,
        updatedBy: actorId,
      },
    });
  return insertedId(result);
}
