import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getContext } from "../pkg/requestContext";

export function authenticate(req: any, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    (req as any).user = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET as string,
    );
    const ctx = getContext();
    if (ctx) ctx.employeeId = req.user.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

/** Short-lived token scoped to one object key, for media URLs native <audio>/<img> elements
 *  request directly and can't attach an Authorization header to. */
export function signMediaToken(key: string): string {
  return jwt.sign({ key }, process.env.JWT_SECRET as string, { expiresIn: "15m" });
}

export function authenticateMediaToken(req: any, res: Response, next: NextFunction) {
  const token = req.query.token;
  if (typeof token !== "string") {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { key: string };
    if (decoded.key !== req.params.key) {
      return res.status(403).json({ error: "Token does not match resource" });
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
