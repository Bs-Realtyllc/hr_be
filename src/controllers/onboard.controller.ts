import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as onboardService from "../services/onboard.service";
import AppError from "../pkg/AppError";
import fs from "fs/promises";

//list data in employee_onboarding_profile;
export const list = asyncHandler(async (req: Request, res: Response) => {
  type inputType = "intern" | "employee" | "all";
  const type = (req.query.type as inputType) ?? "all";
  const response = await onboardService.get(type);
  //   console.log(response)
  res.status(200).json(response);
});

// looked up by the candidate's own browser before they've authenticated — pre-fills
// the onboarding form if the job-portal webhook already seeded a draft for their email
export const getDraft = asyncHandler(async (req: Request, res: Response) => {
  const email = (req.query.email as string | undefined)?.trim();
  if (!email) {
    return res.status(200).json({ found: false });
  }

  const draft = await onboardService.getDraft(email);
  if (!draft) {
    return res.status(200).json({ found: false });
  }

  res.status(200).json({ found: true, data: draft });
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
  const onboardId = Number(req.params.id);
  const id = await onboardService.approve(onboardId);
  res.status(200).json({ id });
});

//reject user from employee_onboarding_profile and delete tha data;
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const response = await onboardService.remove(id);
  res.status(200).json(response);
});

// controller

export const getContract = asyncHandler(async (req: any, res: Response) => {
  // console.log(req.user)
  const { filePath, filename } = await onboardService.getContractFilePath(
    req.user,
    Number(req.params.id),
    req.params.type as "photo" | "nda" | "citizenship" | "pan" | "certificate",
  );

  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWDED_ROLES = ["admin"];

export const onboardAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    
    const { name, email, role, gender } = req.body;
    const g= gender ? gender :'prefer_not_to_say';
    if (!name || !email || !role) {
      throw new AppError("Name, email and role are required.", 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Enter a valid email address.", 400);
    }

    if (!ALLOWDED_ROLES.includes(role)) {
      throw new AppError(
        `Role '${role}' is not allowed for this request.`,
        400,
      );
    }
    const { id } = await onboardService.onboardAdmin(name, email, role,g);

    res.status(201).json({
      message: "Access request submitted.",
      id,
    });
  },
);
