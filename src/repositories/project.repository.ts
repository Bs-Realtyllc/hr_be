import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { projects, projectAssignments, milestones, projectServices, employees, designations, employeeDocuments } from '../../drizzle/schema';

const milestonesColumns = {
  id: milestones.id,
  project_id: milestones.projectId,
  title: milestones.title,
  due_date: milestones.dueDate,
  status: milestones.status,
  created_at: milestones.createdAt,
};
const projectsColumns = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  repo_url: projects.repoUrl,
  docs_url: projects.docsUrl,
  status: projects.status,
  roadmap_key: projects.roadmapKey,
  roadmap_label: projects.roadmapLabel,
  public_link: projects.publicLink,
  start_date: projects.startDate,
  expected_end_date: projects.expectedEndDate,
  created_at: projects.createdAt,
  updated_at: projects.updatedAt,
  created_by: projects.createdBy,
  updated_by: projects.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll(status?: string) {
  return db
    .select(projectsColumns)
    .from(projects)
    .where(status ? eq(projects.status, status as any) : undefined)
    .orderBy(desc(projects.createdAt));
}

export async function create(data: any, actorId: number | null = null) {
  const result = await db.insert(projects).values({
    name: data.name,
    description: data.description,
    repoUrl: data.repo_url,
    docsUrl: data.docs_url,
    status: data.status,
    startDate: data.start_date,
    expectedEndDate: data.expected_end_date,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function update(id: number | string, updates: Record<string, any>, actorId: number | null = null) {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  await db
    .update(projects)
    .set({
      name: updates.name,
      description: updates.description,
      repoUrl: updates.repo_url,
      docsUrl: updates.docs_url,
      status: updates.status,
      roadmapKey: updates.roadmap_key,
      roadmapLabel: updates.roadmap_label,
      publicLink: updates.public_link,
      startDate: updates.start_date,
      expectedEndDate: updates.expected_end_date,
      updatedBy: actorId,
    })
    .where(eq(projects.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(projects).where(eq(projects.id, Number(id)));
}

export async function findAssignments(projectId: number | string) {
  return db
    .select({
      id: projectAssignments.id,
      project_id: projectAssignments.projectId,
      employee_id: projectAssignments.employeeId,
      role: projectAssignments.role,
      assigned_at: projectAssignments.assignedAt,
      name: employees.name,
      designation: designations.title,
      profile_picture: employeeDocuments.filename,
    })
    .from(projectAssignments)
    .innerJoin(employees, eq(projectAssignments.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(employeeDocuments, and(eq(employeeDocuments.empId, employees.id), eq(employeeDocuments.name, 'profile_picture')))
    .where(eq(projectAssignments.projectId, Number(projectId)));
}

export async function addAssignment(projectId: number | string, employeeId: number | string, role: string) {
  await db
    .insert(projectAssignments)
    .values({ projectId: Number(projectId), employeeId: Number(employeeId), role })
    .onDuplicateKeyUpdate({ set: { role } });
}

export async function removeAssignment(projectId: number | string, employeeId: number | string) {
  await db
    .delete(projectAssignments)
    .where(and(eq(projectAssignments.projectId, Number(projectId)), eq(projectAssignments.employeeId, Number(employeeId))));
}

export async function findMilestones(projectId: number | string) {
  return db.select(milestonesColumns).from(milestones).where(eq(milestones.projectId, Number(projectId))).orderBy(asc(milestones.dueDate));
}

export const findMilestonesForProject = findMilestones;

export async function addMilestone(projectId: number | string, title: string, due_date: string, status: string) {
  const result = await db.insert(milestones).values({
    projectId: Number(projectId),
    title,
    dueDate: due_date,
    status: status as any,
    createdAt: new Date(),
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
  if (due_date !== undefined) setValues.dueDate = due_date;
  if (status !== undefined) setValues.status = status;
  if (!Object.keys(setValues).length) return;

  await db
    .update(milestones)
    .set(setValues)
    .where(and(eq(milestones.id, Number(milestoneId)), eq(milestones.projectId, Number(projectId))));
}

export async function findServices(projectId: number | string) {
  return db.select({ service_key: projectServices.serviceKey }).from(projectServices).where(eq(projectServices.projectId, Number(projectId)));
}

export async function addService(projectId: number | string, serviceKey: string) {
  await db
    .insert(projectServices)
    .ignore()
    .values({ projectId: Number(projectId), serviceKey });
}

export async function removeService(projectId: number | string, serviceKey: string) {
  await db
    .delete(projectServices)
    .where(and(eq(projectServices.projectId, Number(projectId)), eq(projectServices.serviceKey, serviceKey)));
}

export async function findByEmployee(employeeId: number | string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      repo_url: projects.repoUrl,
      docs_url: projects.docsUrl,
      status: projects.status,
      start_date: projects.startDate,
      expected_end_date: projects.expectedEndDate,
      created_at: projects.createdAt,
      assigned_role: projectAssignments.role,
    })
    .from(projectAssignments)
    .innerJoin(projects, eq(projectAssignments.projectId, projects.id))
    .where(eq(projectAssignments.employeeId, Number(employeeId)))
    .orderBy(desc(projects.createdAt));
}
