import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { projectTodos } from '../models';

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findByProjectId(projectId: number | string) {
  return db
    .select()
    .from(projectTodos)
    .where(eq(projectTodos.project_id, Number(projectId)))
    .orderBy(asc(projectTodos.sort_order), asc(projectTodos.created_at));
}

export async function create(
  projectId: number | string,
  data: { title: string; description?: string; deadline?: string; sort_order?: number },
  actorId: number | null = null
) {
  const result = await db.insert(projectTodos).values({
    project_id: Number(projectId),
    title: data.title,
    description: data.description ?? null,
    deadline: data.deadline ?? null,
    sort_order: data.sort_order ?? 0,
    is_complete: 0,
    created_by: actorId,
    updated_by: actorId,
  } as any);
  return insertedId(result);
}

export async function update(
  todoId: number | string,
  data: { title?: string; description?: string; deadline?: string | null; sort_order?: number },
  actorId: number | null = null
) {
  await db
    .update(projectTodos)
    .set({ ...data, updated_by: actorId } as any)
    .where(eq(projectTodos.id, Number(todoId)));
}

export async function toggleComplete(
  todoId: number | string,
  is_complete: 0 | 1,
  actorId: number | null = null
) {
  await db
    .update(projectTodos)
    .set({ is_complete, updated_by: actorId } as any)
    .where(eq(projectTodos.id, Number(todoId)));
}

export async function remove(todoId: number | string) {
  await db.delete(projectTodos).where(eq(projectTodos.id, Number(todoId)));
}

export async function progressSummary(projectId: number | string): Promise<{ total: number; completed: number; percentage: number }> {
  const rows = await db
    .select({
      total: sql<number>`COUNT(*)`,
      completed: sql<number>`SUM(CASE WHEN ${projectTodos.is_complete} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(projectTodos)
    .where(eq(projectTodos.project_id, Number(projectId)));

  const total = Number(rows[0]?.total ?? 0);
  const completed = Number(rows[0]?.completed ?? 0);
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percentage };
}
