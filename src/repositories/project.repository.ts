import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { projects, projectAssignments, modules, moduleMembers, projectServices, employees, designations, employeeDocuments } from '../../drizzle/schema';

const modulesColumns = {
  id: modules.id,
  project_id: modules.projectId,
  name: modules.name,
  description: modules.description,
  start_date: modules.startDate,
  target_date: modules.targetDate,
  status: modules.status,
  lead_id: modules.leadId,
  lead_name: employees.name,
  created_at: modules.createdAt,
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
  code: projects.code,
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
    code: data.code,
    startDate: data.start_date,
    expectedEndDate: data.expected_end_date,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date(),
  } as any);
  return insertedId(result);
}

export async function existsByCode(code: string): Promise<boolean> {
  const rows = await db.select({ id: projects.id }).from(projects).where(eq(projects.code, code)).limit(1);
  return rows.length > 0;
}

export async function findCodeById(id: number | string): Promise<string | null> {
  const rows = await db.select({ code: projects.code }).from(projects).where(eq(projects.id, Number(id))).limit(1);
  return rows[0]?.code ?? null;
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

export async function addAssignment(projectId: number | string, employeeId: number | string, role?: string) {
  await db
    .insert(projectAssignments)
    .values({ projectId: Number(projectId), employeeId: Number(employeeId), ...(role ? { role } : {}) })
    .onDuplicateKeyUpdate({ set: role ? { role } : { employeeId: Number(employeeId) } });
}

export async function removeAssignment(projectId: number | string, employeeId: number | string) {
  await db
    .delete(projectAssignments)
    .where(and(eq(projectAssignments.projectId, Number(projectId)), eq(projectAssignments.employeeId, Number(employeeId))));
}

export async function findModules(projectId: number | string) {
  return db
    .select(modulesColumns)
    .from(modules)
    .leftJoin(employees, eq(modules.leadId, employees.id))
    .where(eq(modules.projectId, Number(projectId)))
    .orderBy(asc(modules.targetDate));
}

export const findModulesForProject = findModules;

export async function createModule(projectId: number | string, data: {
  name: string; description?: string | null; start_date?: string | null; target_date: string;
  status?: string | null; lead_id?: number | null;
}) {
  const result = await db.insert(modules).values({
    projectId: Number(projectId),
    name: data.name,
    description: data.description ?? null,
    startDate: data.start_date ?? null,
    targetDate: data.target_date,
    status: (data.status ?? 'backlog') as any,
    leadId: data.lead_id ?? null,
    createdAt: new Date(),
  });
  return insertedId(result);
}

export async function updateModule(
  projectId: number | string,
  moduleId: number | string,
  data: { name?: string; description?: string | null; start_date?: string | null; target_date?: string; status?: string; lead_id?: number | null },
) {
  const setValues: Record<string, any> = {};
  if (data.name !== undefined) setValues.name = data.name;
  if (data.description !== undefined) setValues.description = data.description;
  if (data.start_date !== undefined) setValues.startDate = data.start_date;
  if (data.target_date !== undefined) setValues.targetDate = data.target_date;
  if (data.status !== undefined) setValues.status = data.status;
  if (data.lead_id !== undefined) setValues.leadId = data.lead_id;
  if (!Object.keys(setValues).length) return;

  await db
    .update(modules)
    .set(setValues)
    .where(and(eq(modules.id, Number(moduleId)), eq(modules.projectId, Number(projectId))));
}

export async function findModuleMembers(moduleId: number | string) {
  return db
    .select({
      id: moduleMembers.id,
      employee_id: moduleMembers.employeeId,
      name: employees.name,
      designation: designations.title,
    })
    .from(moduleMembers)
    .innerJoin(employees, eq(moduleMembers.employeeId, employees.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .where(eq(moduleMembers.moduleId, Number(moduleId)));
}

export async function addModuleMember(moduleId: number | string, employeeId: number | string) {
  await db
    .insert(moduleMembers)
    .ignore()
    .values({ moduleId: Number(moduleId), employeeId: Number(employeeId) });
}

export async function removeModuleMember(moduleId: number | string, employeeId: number | string) {
  await db
    .delete(moduleMembers)
    .where(and(eq(moduleMembers.moduleId, Number(moduleId)), eq(moduleMembers.employeeId, Number(employeeId))));
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
