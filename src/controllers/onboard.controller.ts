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
const REQUIRED_FIELDS = [
  "contract",
  "citizenshipFront",
  "citizenshipBack",
  "panCard",
  "passoutCertificate",
  "passportPhoto",
] as const;

export const add = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const missing = REQUIRED_FIELDS.filter((field) => !files?.[field]?.[0]);
  if (missing.length > 0) {
    throw new AppError(`Missing required file(s): ${missing.join(", ")}`, 400);
  }

  // Non-null assertion is safe here — we just validated every field exists.
  const filenames = {
    contract: files!.contract[0].filename,
    citizenshipFront: files!.citizenshipFront[0].filename,
    citizenshipBack: files!.citizenshipBack[0].filename,
    panCard: files!.panCard[0].filename,
    passoutCertificate: files!.passoutCertificate[0].filename,
    passportPhoto: files!.passportPhoto[0].filename,
  };
  // console.log('controller', filenames)

  try {
    await onboardService.create(req.body.payload, filenames);
    res.status(201).json({ message: "Onboarding data added sucessfully!" });
  } catch (err) {
    // Roll back all saved files since the DB insert failed
    const allFiles = REQUIRED_FIELDS.flatMap((field) => files![field]);
    await Promise.all(
      allFiles.map((f) =>
        fs.unlink(f.path).catch((unlinkErr) => {
          console.error("Failed to clean up orphaned file:", unlinkErr);
        }),
      ),
    );
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
  // console.log(req.params.id, req.params.type)
  const { filePath, filename } = await onboardService.getContractFilePath(
    Number(req.params.id),
    req.params.type as "photo" | "nda" | "citizenship" | "pan" | "certificate",
  );

  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.sendFile(filePath);
});
