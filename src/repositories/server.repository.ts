import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { servers, projects } from '../../drizzle/schema';

const serversColumns = {
  id: servers.id,
  project_id: servers.projectId,
  name: servers.name,
  environment: servers.environment,
  ip_address: servers.ipAddress,
  domain: servers.domain,
  ssh_user: servers.sshUser,
  notes: servers.notes,
  is_sensitive: servers.isSensitive,
  created_at: servers.createdAt,
  updated_at: servers.updatedAt,
  created_by: servers.createdBy,
  updated_by: servers.updatedBy,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll(projectId?: number | string) {
  return db
    .select({ ...serversColumns, project_name: projects.name })
    .from(servers)
    .leftJoin(projects, eq(servers.projectId, projects.id))
    .where(projectId ? eq(servers.projectId, Number(projectId)) : undefined)
    .orderBy(asc(servers.environment), asc(servers.name));
}

export async function create(data: any, actorId: number | null = null) {
  const result = await db.insert(servers).values({
    projectId: data.project_id,
    name: data.name,
    environment: data.environment,
    ipAddress: data.ip_address,
    domain: data.domain,
    sshUser: data.ssh_user,
    notes: data.notes,
    isSensitive: data.is_sensitive,
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
    .update(servers)
    .set({
      projectId: updates.project_id,
      name: updates.name,
      environment: updates.environment,
      ipAddress: updates.ip_address,
      domain: updates.domain,
      sshUser: updates.ssh_user,
      notes: updates.notes,
      isSensitive: updates.is_sensitive,
      updatedBy: actorId,
    })
    .where(eq(servers.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(servers).where(eq(servers.id, Number(id)));
}
