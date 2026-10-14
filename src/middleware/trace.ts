import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { requestContext, RequestContext } from "../pkg/requestContext";

export const trace = (req: Request, res: Response, next: NextFunction) => {
  const traceId = req.get("x-trace-id") ?? randomUUID();
  const ctx: RequestContext = { traceId };

  res.locals.ctx = ctx; // so morgan can read it when the response finishes
  res.setHeader("x-trace-id", traceId);

  requestContext.run(ctx, next); // call next() ONLY here, not again after
};