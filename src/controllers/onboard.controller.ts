import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as onboardService from "../services/onboard.service";
import AppError from "../pkg/AppError";
import fs from "fs/promises";
import * as onboardDto from "../dtos/onboard.dto";
import type { OnboardFilePaths } from "../dtos/onboard.dto";
import { ONBOARD_FILE_FIELDS, toStoredPath, type OnboardFileField } from "../middleware/uplod";

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
// multipart/form-data from the /onboard/:role form: a JSON `payload` field plus one
// file per document field (see ONBOARD_FILE_FIELDS). Files are already on disk by now.
export const add = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const uploaded = Object.values(files).flat();

  try {
    const fields = Object.keys(ONBOARD_FILE_FIELDS) as OnboardFileField[];
    const missing = fields.filter((f) => ONBOARD_FILE_FIELDS[f].required && !files[f]?.[0]);
    if (missing.length > 0) {
      throw new AppError(`Missing required file(s): ${missing.join(", ")}`, 400);
    }

    const input = onboardDto.toCreateInput(req.body?.payload);

    const filePaths: OnboardFilePaths = {};
    for (const field of fields) {
      const file = files[field]?.[0];
      if (file) filePaths[field] = toStoredPath(file);
    }

    await onboardService.create(input, filePaths);
    res.status(201).json({ message: "Onboarding data added sucessfully!" });
  } catch (err) {
    // Nothing was saved (validation or DB failure) — remove this request's uploads
    await Promise.all(
      uploaded.map((f) =>
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
    req.params.type,
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
