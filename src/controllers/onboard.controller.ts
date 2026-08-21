import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as onboardService from "../services/onboard.service";

//list data in employee_onboarding_profile;
export const list = asyncHandler(async (req: Request, res: Response) => {
  type inputType = "intern" | "employee";
  const type = req.query.type as inputType;
  const response = await onboardService.get(type);
  //   console.log(response)
  res.status(200).json(response);
});

//add data in employee_onboarding_profile;
export const add = asyncHandler(async (req: Request, res: Response) => {
  await onboardService.create(req.body);
  res.status(201).json({ message: "Onboarding data added sucessfully!" });
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
