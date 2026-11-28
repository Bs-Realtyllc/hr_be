import * as projectRepo from '../repositories/project.repository';
import * as employeeRepo from '../repositories/employee.repository';
import AppError from '../pkg/AppError';
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  AssignmentInput,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleMemberInput,
} from '../dtos/project.dto';

type Requester = { id: number; role: string };

export async function list(status?: string) {
  return projectRepo.findAll(status);
}

// Mirrors how Jira auto-suggests a project key from its name, letting the
// caller override by supplying `code` explicitly instead.
export function deriveProjectCode(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (letters.slice(0, 4) || 'PRJ').padEnd(2, 'X');
}

export async function ensureUniqueCode(baseCode: string): Promise<string> {
  let candidate = baseCode;
  let suffix = 2;
  while (await projectRepo.existsByCode(candidate)) {
    candidate = `${baseCode}${suffix}`.slice(0, 10);
    suffix += 1;
  }
  return candidate;
}

export async function create(data: ProjectCreateInput, actorId: number | null) {
  let code: string;
  if (data.code) {
    // An explicitly chosen code must be free — auto-suffixing it would
    // silently give the caller a different code than the one they asked for.
    if (await projectRepo.existsByCode(data.code)) {
      throw new AppError(`Project code "${data.code}" is already in use`, 400);
    }
    code = data.code;
  } else {
    code = await ensureUniqueCode(deriveProjectCode(data.name));
  }
  return projectRepo.create({ ...data, code }, actorId);
}

export async function update(id: string, updates: ProjectUpdateInput, actorId: number | null) {
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await projectRepo.update(id, updates, actorId);
}

export async function remove(id: string) {
  await projectRepo.remove(id);
}

// A project Admin manages their own team/modules/labels without needing a
// global HR admin — the thing a purely decorative "role" column couldn't do.
// Deliberately not called "project lead": this HR app's global role enum
// already has a 'lead' value with real company-wide power (leave approval,
// payroll, performance reviews — see requireRole('admin', 'lead') across
// the other route modules), and reusing that word for a project-scoped tier
// would make "they're this project's lead" look like it grants those same
// powers. Jira/Plane avoid this the same way — project-level tiers are
// Admin/Member(/Guest), never "Lead"; "lead" stays reserved for Module.leadId,
// a single-owner field, not a permission tier.
export async function assertProjectAdmin(projectId: number | string, requester: Requester) {
  if (requester.role === 'admin' || requester.role === 'lead') return;
  const assignments = await projectRepo.findAssignments(projectId);
  const mine = assignments.find((a: any) => a.employee_id === requester.id);
  if (!mine || mine.role !== 'admin') {
    throw new AppError('Only a project admin or HR admin can manage this project', 403);
  }
}

// moduleId is a path param on routes already scoped to :id (the project),
// but nothing stops a caller from passing a module that belongs to a
// different project — same reason issues validate module_id against
// assertLabelsAndModuleInProject before attaching it.
async function assertModuleInProject(projectId: number | string, moduleId: number | string) {
  const projectModules = await projectRepo.findModules(projectId);
  const found = projectModules.find((m: any) => m.id === Number(moduleId));
  if (!found) throw new AppError('Module does not belong to this project', 404);
  return found;
}

// Same pair of checks issue.service.ts runs on assignee_id/start_date+due_date
// — a module's lead is just as capable of pointing at a terminated/nonexistent
// employee, and its date range is just as capable of being backwards.
async function assertLeadValid(leadId: number | null | undefined) {
  if (!leadId) return;
  const emp = await employeeRepo.findById(leadId);
  if (!emp) throw new AppError('Lead not found', 400);
  if (emp.status === 'terminated') throw new AppError('Cannot set a terminated employee as lead', 400);
}

function assertValidModuleDateRange(startDate: string | null | undefined, targetDate: string | null | undefined) {
  if (startDate && targetDate && startDate > targetDate) {
    throw new AppError('start_date cannot be after target_date', 400);
  }
}

export async function getAssignments(id: string) {
  return projectRepo.findAssignments(id);
}

export async function addAssignment(id: string, input: AssignmentInput, requester: Requester) {
  await assertProjectAdmin(id, requester);
  await projectRepo.addAssignment(id, input.employee_id, input.role ?? 'member');
}

export async function removeAssignment(id: string, empId: string, requester: Requester) {
  await assertProjectAdmin(id, requester);
  await projectRepo.removeAssignment(id, empId);
}

export async function getModules(id: string) {
  return projectRepo.findModules(id);
}

export async function createModule(id: string, input: ModuleCreateInput, requester: Requester) {
  await assertProjectAdmin(id, requester);
  await assertLeadValid(input.lead_id);
  assertValidModuleDateRange(input.start_date, input.target_date);
  return projectRepo.createModule(id, input);
}

export async function updateModule(id: string, moduleId: string, input: ModuleUpdateInput, requester: Requester) {
  await assertProjectAdmin(id, requester);
  const existing = await assertModuleInProject(id, moduleId);
  await assertLeadValid(input.lead_id);
  assertValidModuleDateRange(
    'start_date' in input ? input.start_date : existing.start_date,
    'target_date' in input ? input.target_date : existing.target_date,
  );
  await projectRepo.updateModule(id, moduleId, input);
}

export async function getModuleMembers(id: string, moduleId: string) {
  await assertModuleInProject(id, moduleId);
  return projectRepo.findModuleMembers(moduleId);
}

export async function addModuleMember(id: string, moduleId: string, input: ModuleMemberInput, requester: Requester) {
  await assertProjectAdmin(id, requester);
  await assertModuleInProject(id, moduleId);
  await projectRepo.addModuleMember(moduleId, input.employee_id);
}

export async function removeModuleMember(id: string, moduleId: string, empId: string, requester: Requester) {
  await assertProjectAdmin(id, requester);
  await assertModuleInProject(id, moduleId);
  await projectRepo.removeModuleMember(moduleId, empId);
}

export async function getServices(id: string) {
  const rows = await projectRepo.findServices(id);
  return rows.map((r) => r.service_key);
}

export async function addService(id: string, serviceKey: string) {
  await projectRepo.addService(id, serviceKey);
}

export async function removeService(id: string, serviceKey: string) {
  await projectRepo.removeService(id, serviceKey);
}

export async function byEmployee(empId: string) {
  const rows = await projectRepo.findByEmployee(empId);

  const withModules = [];
  for (const row of rows) {
    const projectModules = await projectRepo.findModulesForProject(row.id);
    withModules.push({ ...row, modules: projectModules });
  }
  return withModules;
}
