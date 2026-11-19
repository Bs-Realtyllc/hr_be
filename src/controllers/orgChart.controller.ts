import { Request, Response } from "express";
import * as orgChartService from "../services/orgChart.service";
import asyncHandler from "../middleware/asyncHandler";

// GET /api/org-chart → [{ id, name, profile_picture, designation, department_id, department, manager_id, status }]
export const get = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await orgChartService.getOrgChart();
  res.json(rows);
});
