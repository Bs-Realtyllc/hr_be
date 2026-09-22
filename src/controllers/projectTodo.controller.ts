import { Request, Response } from "express";
import * as repo from "../repositories/projectTodo.repository";
import asyncHandler from "../middleware/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const todos = await repo.findByProjectId(req.params.id);
  res.json(todos);
});

export const create = asyncHandler(async (req: any, res: Response) => {
  const { title, description, deadline, sort_order } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const id = await repo.create(
    req.params.id,
    { title, description, deadline, sort_order },
    req.user?.id ?? null,
  );
  res.status(201).json({ id });
});

export const update = asyncHandler(async (req: any, res: Response) => {
  const { title, description, deadline, sort_order } = req.body;
  await repo.update(
    req.params.tid,
    { title, description, deadline, sort_order },
    req.user?.id ?? null,
  );
  res.json({ success: true });
});

export const toggle = asyncHandler(async (req: any, res: Response) => {
  const { is_complete } = req.body;
  if (is_complete === undefined) {
    return res.status(400).json({ error: "is_complete is required" });
  }
  await repo.toggleComplete(
    req.params.tid,
    is_complete ? 1 : 0,
    req.user?.id ?? null,
  );
  res.json({ success: true });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await repo.remove(req.params.tid);
  res.json({ success: true });
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await repo.progressSummary(req.params.id);
  res.json(data);
});
