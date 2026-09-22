import asyncHandler from "../middleware/asyncHandler";
import { Request, Response } from "express";
import * as clockServices from "../services/clock.service";

export const clockIn = asyncHandler(async (req: any, res: Response) => {
  const result = await clockServices.clockIn(req.user.id);
  res
    .status(201)
    .json({ message: "clock in sucessfull", clockInTime: result.clockIn });
});

export const getClock = asyncHandler(async (req: any, res: Response) => {
  const date = req.query.date as string;
  const result = await clockServices.getClock(req.user.id, date);
  res.status(200).json({ result });
});

export const clockOut = asyncHandler(async (req: any, res: Response) => {
  const result = await clockServices.clockOut(req.user.id);
  res.status(200).json({ message: "clock out sucessfull", result });
});

export const pause = asyncHandler(async (req: any, res: Response) => {
  // console.log(req.body)
  const result = await clockServices.pause(req.user.id, req.body.reason);
  res.status(200).json({ result });
});

export const resume = asyncHandler(async (req: any, res: Response) => {
  const result = await clockServices.resume(req.user.id);
  res.status(200).json({ result });
});
