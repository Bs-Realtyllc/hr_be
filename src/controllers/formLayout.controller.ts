import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import * as formLayoutService from "../services/formLayout.service";

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
