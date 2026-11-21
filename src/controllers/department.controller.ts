import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import asyncHandler from "../middleware/asyncHandler";

// GET /api/departments → [{ id, name, head_position_id, head_employee_name, ... }]
export const list = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await departmentService.list();
  res.json(rows);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const id = await departmentService.create(name);
  res.status(201).json({ id });
});

export const setHead = asyncHandler(async (req: Request, res: Response) => {
  const { position_id } = req.body;
  await departmentService.setHead(req.params.id, position_id ?? null);
  res.json({ success: true });
});
