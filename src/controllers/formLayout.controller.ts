import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as formLayoutService from "../services/formLayout.service";
import * as formLayoutDto from "../dtos/formLayout.dto";
import AppError from "../pkg/AppError";

const actorId = (req: Request): number | null =>
  (req as any).user?.id ?? null;

export const getFormLayout = asyncHandler(
  async (req: Request, res: Response) => {
    const type = formLayoutDto.toLayoutType(req.query.type);
    const { sections, contractTemplate } = await formLayoutService.get(type);
    res.status(200).json(formLayoutDto.toLayoutResponse(sections, contractTemplate));
  },
);

export const setFormLayout = asyncHandler(
  async (req: Request, res: Response) => {
    const input = formLayoutDto.toSaveInput(req.body);
    await formLayoutService.save(input, actorId(req));
    res.status(200).json({ message: "Form layout saved successfully!" });
  },
);

export const uploadContractTemplate = asyncHandler(
  async (req: any, res: Response) => {
    const type = formLayoutDto.toLayoutType(req.query.type);
    if (!req.file) {
      throw new AppError("Template file is required.", 400);
    }
    await formLayoutService.saveContractTemplate(
      type,
      req.file.filename,
      req.file.originalname,
      actorId(req),
    );
    res.status(200).json({ message: "Contract template saved successfully!" });
  },
);

export const downloadContractTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const type = formLayoutDto.toLayoutType(req.query.type);
    const { filePath, originalName } =
      await formLayoutService.getContractTemplatePath(type);
    res.download(filePath, originalName);
  },
);

export const deleteContractTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const type = formLayoutDto.toLayoutType(req.query.type);
    await formLayoutService.removeContractTemplate(type, actorId(req));
    res.status(200).json({ message: "Contract template removed." });
  },
);
