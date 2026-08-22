import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as onboardService from "../services/onboard.service";
import AppError from "../pkg/AppError";
import fs from "fs/promises";

//list data in employee_onboarding_profile;
export const list = asyncHandler(async (req: Request, res: Response) => {
  type inputType = "intern" | "employee" | "all";
  const type = req.query.type as inputType;
  const response = await onboardService.get(type);
  //   console.log(response)
  res.status(200).json(response);
});

//add data in employee_onboarding_profile;
export const add = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("Contract file is required.", 400);
  }
  try {
    await onboardService.create(req.body.payload, req.file.filename);
    res.status(201).json({ message: "Onboarding data added sucessfully!" });
  } catch (err) {
    // Roll back the file save since the DB insert failed
    await fs.unlink(req.file.path).catch((unlinkErr) => {
      console.error("Failed to clean up orphaned file:", unlinkErr);
    });
    throw err; // let asyncHandler/error middleware handle the actual response
  }
});

//approve user from employee_onboarding_profile and move tha data to employees table;
export const approve = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const response = await onboardService.approve(id);
  res.status(200).json(response);
});

//reject user from employee_onboarding_profile and delete tha data;
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const response = await onboardService.remove(id);
  res.status(200).json(response);
});

// controller

export const getContract = asyncHandler(async (req: Request, res: Response) => {
  const { filePath, filename } = await onboardService.getContractFilePath(
    Number(req.params.id),
  );

  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.sendFile(filePath);
});
