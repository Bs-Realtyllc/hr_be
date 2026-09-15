import { Request, Response } from 'express';
import { db } from '../config/database';
import { projects, projectTodos } from '../models';
import { eq, isNotNull, sql } from 'drizzle-orm';
import asyncHandler from '../middleware/asyncHandler';

export const getRoadmap = asyncHandler(async (_req: Request, res: Response) => {
  // Fetch all projects that have a roadmap_key set (opt-in to public roadmap)
  const projectRows = await db
    .select()
    .from(projects)
    .where(isNotNull(projects.roadmap_key));

  // Compute todo progress for each project in parallel
  const items = await Promise.all(
    projectRows.map(async (project) => {
      const [summaryRow] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          completed: sql<number>`SUM(CASE WHEN ${projectTodos.is_complete} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(projectTodos)
        .where(eq(projectTodos.project_id, project.id));

      const total = Number(summaryRow?.total ?? 0);
      const completed = Number(summaryRow?.completed ?? 0);
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        key: project.roadmap_key,
        title: project.name,
        description: project.description ?? '',
        label: project.roadmap_label ?? project.expected_end_date ?? null,
        deadline: project.expected_end_date ?? null,
        link: project.public_link ?? null,
        progress: percentage,
        total_todos: total,
        completed_todos: completed,
      };
    })
  );

  res.json(items);
});
