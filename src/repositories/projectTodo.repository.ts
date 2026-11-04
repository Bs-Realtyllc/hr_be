import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { projectTodos } from '../../drizzle/schema';

const projectTodosColumns = {
  id: projectTodos.id,
  project_id: projectTodos.projectId,
  title: projectTodos.title,
  description: projectTodos.description,
  deadline: projectTodos.deadline,
  is_complete: projectTodos.isComplete,
  sort_order: projectTodos.sortOrder,
  created_by: projectTodos.createdBy,
  updated_by: projectTodos.updatedBy,
  created_at: projectTodos.createdAt,
  updated_at: projectTodos.updatedAt,
};

function insertedId(result: any): number {
  return result[0].insertId as number;
}

export async function findByProjectId(projectId: number | string) {
  return db
    .select(projectTodosColumns)
    .from(projectTodos)
    .where(eq(projectTodos.projectId, Number(projectId)))
    .orderBy(asc(projectTodos.sortOrder), asc(projectTodos.createdAt));
}

export async function create(
  projectId: number | string,
  data: { title: string; description?: string; deadline?: string; sort_order?: number },
  actorId: number | null = null
) {
  const result = await db.insert(projectTodos).values({
    projectId: Number(projectId),
    title: data.title,
    description: data.description ?? null,
    deadline: data.deadline ?? null,
    sortOrder: data.sort_order ?? 0,
    isComplete: 0,
    createdBy: actorId,
    updatedBy: actorId,
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
    .set({
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      sortOrder: data.sort_order,
      updatedBy: actorId,
    })
    .where(eq(projectTodos.id, Number(todoId)));
}

export async function toggleComplete(
  todoId: number | string,
  is_complete: 0 | 1,
  actorId: number | null = null
) {
  await db
    .update(projectTodos)
    .set({ isComplete: is_complete, updatedBy: actorId } as any)
    .where(eq(projectTodos.id, Number(todoId)));
}

export async function remove(todoId: number | string) {
  await db.delete(projectTodos).where(eq(projectTodos.id, Number(todoId)));
}

export async function progressSummary(projectId: number | string): Promise<{ total: number; completed: number; percentage: number }> {
  const rows = await db
    .select({
      total: sql<number>`COUNT(*)`,
      completed: sql<number>`SUM(CASE WHEN ${projectTodos.isComplete} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(projectTodos)
    .where(eq(projectTodos.projectId, Number(projectId)));

  const total = Number(rows[0]?.total ?? 0);
  const completed = Number(rows[0]?.completed ?? 0);
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percentage };
}
