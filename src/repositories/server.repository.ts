import { eq, asc, getTableColumns } from 'drizzle-orm';
import { db } from '../config/database';
import { servers, projects } from '../models';

// Same exported function names/signatures as the old src/models/Server.js.

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findAll(projectId?: number | string) {
  return db
    .select({ ...getTableColumns(servers), project_name: projects.name })
    .from(servers)
    .leftJoin(projects, eq(servers.project_id, projects.id))
    .where(projectId ? eq(servers.project_id, Number(projectId)) : undefined)
    .orderBy(asc(servers.environment), asc(servers.name));
}

export async function create(data: any, actorId: number | null = null) {
  const result = await db.insert(servers).values({
    project_id: data.project_id,
    name: data.name,
    environment: data.environment,
    ip_address: data.ip_address,
    domain: data.domain,
    ssh_user: data.ssh_user,
    notes: data.notes,
    is_sensitive: data.is_sensitive,
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
    .update(servers)
    .set({ ...updates, updated_by: actorId })
    .where(eq(servers.id, Number(id)));
}

export async function remove(id: number | string) {
  await db.delete(servers).where(eq(servers.id, Number(id)));
}
