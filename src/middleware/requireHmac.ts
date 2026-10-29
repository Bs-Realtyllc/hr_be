// middleware/requireHmac.ts
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const MAX_SKEW_MS = 100 * 60 * 1000; // reject requests older than 5 minutes

export function requireHmac(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.HMAC_SECRET;
  const timestamp = req.header("x-timestamp");
  const signature = req.header("x-signature");

  if (!secret || !timestamp || !signature) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
  const path = req.originalUrl.split("?")[0];
  const expected = crypto
  .createHmac("sha256", secret)
  .update(`${timestamp}.${req.method}.${path}`)
  .digest("hex");
  
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}