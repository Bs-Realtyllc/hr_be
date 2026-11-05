import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as onboardService from "../services/onboard.service";
import AppError from "../pkg/AppError";
import fs from "fs/promises";
import { onboardFileKey, signMediaToken } from "../middleware/auth";

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
// Every upload is optional; see the field list in onboard.routes.ts.
const MAX_ENTRY_FILES = 5;

export const add = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const fileName = (field: string) => files?.[field]?.[0]?.filename;

  const filenames = {
    passportPhoto: fileName("passportPhoto"),
    idFront: fileName("idFront"),
    idBack: fileName("idBack"),
    panFront: fileName("panFront"),
    panBack: fileName("panBack"),
    additionalDocument: fileName("additionalDocument"),
    contract: fileName("contract"),
    otherDocument: fileName("otherDocument"),
    // index i belongs to education_info[i] / previous_experience_info[i]
    educationCertificates: Array.from({ length: MAX_ENTRY_FILES }, (_, i) =>
      fileName(`educationCertificate_${i}`),
    ),
    experienceLetters: Array.from({ length: MAX_ENTRY_FILES }, (_, i) =>
      fileName(`experienceLetter_${i}`),
    ),
  };

  try {
    await onboardService.create(req.body.payload, filenames);
    res.status(201).json({ message: "Onboarding data added sucessfully!" });
  } catch (err) {
    // Roll back all saved files since the DB insert failed
    const allFiles = Object.values(files ?? {}).flat();
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
  const {id} = await onboardService.approve(onboardId);
  res.status(200).json({ id });
});

//reject user from employee_onboarding_profile and delete tha data;
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const response = await onboardService.deactivateOnboardProfile(id);
  res.status(200).json(response);
});

// Returns a 15-minute signed link the frontend can window.open() — a new window
// can't send the Authorization header that the file route would otherwise need.
export const getDocumentUrl = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const type = req.params.type as string;
  // 404 now rather than opening a window onto an error page.
  await onboardService.getContractFilePath(id, type);

  const apiBase = process.env.API_BASE_URL ?? `${req.protocol}://${req.get("host")}/api`;
  const url = `${apiBase}/onboard/${id}/${encodeURIComponent(type)}?token=${signMediaToken(onboardFileKey(id, type))}`;
  res.status(200).json({ url });
});

// Opened directly in a new window; access is checked by the ?token in the route.
export const getContract = asyncHandler(async (req: any, res: Response) => {
  const { filePath, filename } = await onboardService.getContractFilePath(
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
