import { Request, Response } from "express";
import * as designationService from "../services/designation.service";
import asyncHandler from "../middleware/asyncHandler";

// GET /api/designations → [{ id, name }]
export const list = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await designationService.list();
  res.json(rows);
});
