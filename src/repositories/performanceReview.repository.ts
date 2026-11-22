import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { performanceReviews, employees, designations, departments } from '../../drizzle/schema';

const performanceReviewsColumns = {
  id: performanceReviews.id,
  employee_id: performanceReviews.employeeId,
  reviewer_id: performanceReviews.reviewerId,
  review_period: performanceReviews.reviewPeriod,
  overall_rating: performanceReviews.overallRating,
  category_ratings: performanceReviews.categoryRatings,
  strengths: performanceReviews.strengths,
  improvements: performanceReviews.improvements,
  manager_comments: performanceReviews.managerComments,
  employee_comments: performanceReviews.employeeComments,
  status: performanceReviews.status,
  submitted_at: performanceReviews.submittedAt,
  acknowledged_at: performanceReviews.acknowledgedAt,
  created_at: performanceReviews.createdAt,
  updated_at: performanceReviews.updatedAt,
  updated_by: performanceReviews.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const reviewer = alias(employees, 'pr_reviewer');

export async function findWithNames({ employeeId, status }: { employeeId?: number | string; status?: string }) {
  const conditions = [];
  if (employeeId) conditions.push(eq(performanceReviews.employeeId, Number(employeeId)));
  if (status) conditions.push(eq(performanceReviews.status, status as any));

  return db
    .select({
      ...performanceReviewsColumns,
      employee_name: employees.name,
      designation: designations.title,
      department: departments.name,
      reviewer_name: reviewer.name,
    })
    .from(performanceReviews)
    .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(reviewer, eq(performanceReviews.reviewerId, reviewer.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(performanceReviews.reviewPeriod), desc(performanceReviews.createdAt));
}

export async function findById(id: number | string) {
  const rows = await db.select(performanceReviewsColumns).from(performanceReviews).where(eq(performanceReviews.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: any) {
  const result = await db.insert(performanceReviews).values({
    employeeId: data.employee_id,
    reviewerId: data.reviewer_id,
    reviewPeriod: data.review_period,
    overallRating: data.overall_rating != null ? String(data.overall_rating) : null,
    categoryRatings: data.category_ratings || {},
    strengths: data.strengths,
    improvements: data.improvements,
    managerComments: data.manager_comments,
    status: 'draft',
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function update(id: number | string, data: any, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({
      overallRating: data.overall_rating != null ? String(data.overall_rating) : null,
      categoryRatings: data.category_ratings || {},
      strengths: data.strengths,
      improvements: data.improvements,
      managerComments: data.manager_comments,
      updatedBy: actorId,
    })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function submit(id: number | string, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({ status: 'submitted', submittedAt: new Date(), updatedBy: actorId })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function acknowledge(id: number | string, employeeComments: string | null, actorId: number | null = null) {
  await db
    .update(performanceReviews)
    .set({ status: 'acknowledged', acknowledgedAt: new Date(), employeeComments, updatedBy: actorId })
    .where(eq(performanceReviews.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(performanceReviews).where(eq(performanceReviews.id, Number(id)));
}

export async function ratingTrendByEmployee(employeeId: number | string) {
  return db
    .select({ review_period: performanceReviews.reviewPeriod, overall_rating: performanceReviews.overallRating })
    .from(performanceReviews)
    .where(
      and(
        eq(performanceReviews.employeeId, Number(employeeId)),
        inArray(performanceReviews.status, ['submitted', 'acknowledged'])
      )
    )
    .orderBy(asc(performanceReviews.reviewPeriod));
}
