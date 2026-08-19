import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { projects, projectAssignments, milestones, projectServices, employees, designations, employeeDocuments } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll(status?: string) {
  return db
    .select()
    .from(projects)
    .where(status ? eq(projects.status, status as any) : undefined)
    .orderBy(desc(projects.created_at));
}

export async function create(data: any, actorId: number | null = null) {
  const result = await db.insert(projects).values({
    name: data.name,
    description: data.description,
    repo_url: data.repo_url,
    docs_url: data.docs_url,
    status: data.status,
    start_date: data.start_date,
    expected_end_date: data.expected_end_date,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  } as any);
  return insertedId(result);
}

export async function update(id: number | string, updates: Record<string, any>, actorId: number | null = null) {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  await db
    .update(projects)
    .set({ ...updates, updated_by: actorId })
    .where(eq(projects.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(projects).where(eq(projects.id, Number(id)));
}

export async function findAssignments(projectId: number | string) {
  return db
    .select({
      id: projectAssignments.id,
      project_id: projectAssignments.project_id,
      employee_id: projectAssignments.employee_id,
      role: projectAssignments.role,
      assigned_at: projectAssignments.assigned_at,
      name: employees.name,
      designation: designations.title,
      profile_picture: employeeDocuments.filename,
    })
    .from(projectAssignments)
    .innerJoin(employees, eq(projectAssignments.employee_id, employees.id))
    .leftJoin(designations, eq(employees.designation_id, designations.id))
    .leftJoin(employeeDocuments, and(eq(employeeDocuments.emp_id, employees.id), eq(employeeDocuments.name, 'profile_picture')))
    .where(eq(projectAssignments.project_id, Number(projectId)));
}

export async function addAssignment(projectId: number | string, employeeId: number | string, role: string) {
  await db
    .insert(projectAssignments)
    .values({ project_id: Number(projectId), employee_id: Number(employeeId), role })
    .onDuplicateKeyUpdate({ set: { role } });
}

export async function removeAssignment(projectId: number | string, employeeId: number | string) {
  await db
    .delete(projectAssignments)
    .where(and(eq(projectAssignments.project_id, Number(projectId)), eq(projectAssignments.employee_id, Number(employeeId))));
}

export async function findMilestones(projectId: number | string) {
  return db.select().from(milestones).where(eq(milestones.project_id, Number(projectId))).orderBy(asc(milestones.due_date));
}

export const findMilestonesForProject = findMilestones;

export async function addMilestone(projectId: number | string, title: string, due_date: string, status: string) {
  const result = await db.insert(milestones).values({
    project_id: Number(projectId),
    title,
    due_date,
    status: status as any,
    created_at: new Date(),
  });
  return insertedId(result);
}

export async function updateMilestone(
  projectId: number | string,
  milestoneId: number | string,
  title?: string,
  due_date?: string,
  status?: string
) {
  const setValues: Record<string, any> = {};
  if (title !== undefined) setValues.title = title;
  if (due_date !== undefined) setValues.due_date = due_date;
  if (status !== undefined) setValues.status = status;
  if (!Object.keys(setValues).length) return;

  await db
    .update(milestones)
    .set(setValues)
    .where(and(eq(milestones.id, Number(milestoneId)), eq(milestones.project_id, Number(projectId))));
}

export async function findServices(projectId: number | string) {
  return db.select({ service_key: projectServices.service_key }).from(projectServices).where(eq(projectServices.project_id, Number(projectId)));
}

export async function addService(projectId: number | string, serviceKey: string) {
  await db
    .insert(projectServices)
    .ignore()
    .values({ project_id: Number(projectId), service_key: serviceKey });
}

export async function removeService(projectId: number | string, serviceKey: string) {
  await db
    .delete(projectServices)
    .where(and(eq(projectServices.project_id, Number(projectId)), eq(projectServices.service_key, serviceKey)));
}

export async function findByEmployee(employeeId: number | string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      repo_url: projects.repo_url,
      docs_url: projects.docs_url,
      status: projects.status,
      start_date: projects.start_date,
      expected_end_date: projects.expected_end_date,
      created_at: projects.created_at,
      assigned_role: projectAssignments.role,
    })
    .from(projectAssignments)
    .innerJoin(projects, eq(projectAssignments.project_id, projects.id))
    .where(eq(projectAssignments.employee_id, Number(employeeId)))
    .orderBy(desc(projects.created_at));
}
