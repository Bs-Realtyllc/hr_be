import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database';
import { goals, employees, designations, departments } from '../../drizzle/schema';

const goalsColumns = {
  id: goals.id,
  employee_id: goals.employeeId,
  title: goals.title,
  description: goals.description,
  category: goals.category,
  metric_unit: goals.metricUnit,
  target_value: goals.targetValue,
  current_value: goals.currentValue,
  weight: goals.weight,
  status: goals.status,
  start_date: goals.startDate,
  due_date: goals.dueDate,
  created_by: goals.createdBy,
  updated_by: goals.updatedBy,
  created_at: goals.createdAt,
  updated_at: goals.updatedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

const creator = alias(employees, 'goal_creator');

export async function findWithNames({
  employeeId,
  status,
  category,
}: {
  employeeId?: number | string;
  status?: string;
  category?: string;
}) {
  const conditions = [];
  if (employeeId) conditions.push(eq(goals.employeeId, Number(employeeId)));
  if (status) conditions.push(eq(goals.status, status as any));
  if (category) conditions.push(eq(goals.category, category as any));

  return db
    .select({
      ...goalsColumns,
      employee_name: employees.name,
      designation: designations.title,
      department: departments.name,
      created_by_name: creator.name,
    })
    .from(goals)
    .innerJoin(employees, eq(goals.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(creator, eq(goals.createdBy, creator.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      sql`FIELD(${goals.status}, 'at_risk','in_progress','not_started','completed','missed')`,
      sql`${goals.dueDate} IS NULL`,
      goals.dueDate
    );
}

export async function findById(id: number | string) {
  const rows = await db.select(goalsColumns).from(goals).where(eq(goals.id, Number(id))).limit(1);
  return rows[0] || null;
}

export async function create(data: any) {
  const result = await db.insert(goals).values({
    employeeId: data.employee_id,
    title: data.title,
    description: data.description,
    category: data.category,
    metricUnit: data.metric_unit,
    targetValue: String(data.target_value),
    currentValue: String(data.current_value),
    weight: data.weight,
    status: data.status,
    startDate: data.start_date,
    dueDate: data.due_date,
    createdBy: data.created_by,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function updateProgress(id: number | string, { current_value, status }: any, actorId: number | null = null) {
  await db
    .update(goals)
    .set({ currentValue: String(current_value), status, updatedBy: actorId })
    .where(eq(goals.id, Number(id)));
}

export async function update(id: number | string, data: any, actorId: number | null = null) {
  await db
    .update(goals)
    .set({
      title: data.title,
      description: data.description,
      category: data.category,
      metricUnit: data.metric_unit,
      targetValue: String(data.target_value),
      weight: data.weight,
      startDate: data.start_date,
      dueDate: data.due_date,
      updatedBy: actorId,
    })
    .where(eq(goals.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(goals).where(eq(goals.id, Number(id)));
}

export async function summaryByEmployee() {
  const result: any = await db.execute(sql`
    SELECT e.id AS employee_id, e.name AS employee_name,
           COUNT(g.id) AS total_goals,
           SUM(g.status = 'completed') AS completed_goals,
           SUM(g.status = 'at_risk') AS at_risk_goals,
           AVG(CASE WHEN g.target_value > 0 THEN LEAST(g.current_value / g.target_value, 1) * 100 ELSE NULL END) AS avg_progress
    FROM employees e
    LEFT JOIN goals g ON g.employee_id = e.id
    WHERE e.status NOT IN ('onboarding', 'terminated')
    GROUP BY e.id, e.name
    HAVING total_goals > 0
    ORDER BY e.name
  `);
  return result[0] as any[];
}
