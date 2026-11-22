import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import asyncHandler from "../middleware/asyncHandler";

// GET /api/departments → [{ id, name }]
export const list = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await departmentService.list();
  res.json(rows);
});
