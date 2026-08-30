import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as formLayoutService from "../services/formLayout.service";
import AppError from "../pkg/AppError";

export const getFormLayout = asyncHandler(
  async (req: Request, res: Response) => {
    const name = req.query.type as string;
    // console.log(name)
    const data = await formLayoutService.get(name);
    res.status(200).json({ data });
  },
);

export const setFormLayout = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, data } = req.body;
    const form = await formLayoutService.create(name, data);
    // console.log("created", form);
    res.status(200).json({ message: "Form set sucessfully!" });
  },
);

export const uploadContractTemplate = asyncHandler(
  async (req: any, res: Response) => {
    const name = req.query.type as string;
    if (!req.file) {
      throw new AppError("Template file is required.", 400);
    }
    await formLayoutService.saveContractTemplate(
      name,
      req.file.filename,
      req.file.originalname,
    );
    res.status(200).json({ message: "Contract template saved successfully!" });
  },
);

export const downloadContractTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const name = req.query.type as string;
    const { filePath, originalName } =
      await formLayoutService.getContractTemplatePath(name);
    res.download(filePath, originalName);
  },
);

export const deleteContractTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const name = req.query.type as string;
    await formLayoutService.removeContractTemplate(name);
    res.status(200).json({ message: "Contract template removed." });
  },
);
