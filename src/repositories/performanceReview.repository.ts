import { eq, and, asc, desc, inArray, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { performanceReviews, employeesFlat } from '../models';

// Same exported function names/signatures as the old src/models/PerformanceReview.js.

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const reviewer = alias(employeesFlat, 'pr_reviewer');

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(performanceReviews.employee_id, Number(employeeId)));
  if (status) conditions.push(eq(performanceReviews.status, status as any));

  return db
    .select({
      ...getTableColumns(performanceReviews),
      employee_name: employeesFlat.name,
      designation: employeesFlat.designation,
      department: employeesFlat.department,
      reviewer_name: reviewer.name,
    })
    .from(performanceReviews)
    .innerJoin(employeesFlat, eq(performanceReviews.employee_id, employeesFlat.id))
    .leftJoin(reviewer, eq(performanceReviews.reviewer_id, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(performanceReviews.review_period), desc(performanceReviews.created_at));
}

export async function findById(id: number | string) {
  const rows = await db.select().from(performanceReviews).where(eq(performanceReviews.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: any) {
  const result = await db.insert(performanceReviews).values({
    employee_id: data.employee_id,
    reviewer_id: data.reviewer_id,
    review_period: data.review_period,
    overall_rating: data.overall_rating != null ? String(data.overall_rating) : null,
    category_ratings: data.category_ratings || {},
    strengths: data.strengths,
    improvements: data.improvements,
    manager_comments: data.manager_comments,
    status: 'draft',
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function update(id: number | string, data: any, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({
      overall_rating: data.overall_rating != null ? String(data.overall_rating) : null,
      category_ratings: data.category_ratings || {},
      strengths: data.strengths,
      improvements: data.improvements,
      manager_comments: data.manager_comments,
      updated_by: actorId,
    })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function submit(id: number | string, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({ status: 'submitted', submitted_at: new Date(), updated_by: actorId })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function acknowledge(id: number | string, employeeComments: string | null, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({ status: 'acknowledged', acknowledged_at: new Date(), employee_comments: employeeComments, updated_by: actorId })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(performanceReviews).where(eq(performanceReviews.id, Number(id)));
}

export async function ratingTrendByEmployee(employeeId: number | string) {
  return db
    .select({ review_period: performanceReviews.review_period, overall_rating: performanceReviews.overall_rating })
    .from(performanceReviews)
    .where(
      and(
        eq(performanceReviews.employee_id, Number(employeeId)),
        inArray(performanceReviews.status, ['submitted', 'acknowledged'])
      )
    )
    .orderBy(asc(performanceReviews.review_period));
}
