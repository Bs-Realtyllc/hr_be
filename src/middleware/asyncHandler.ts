import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async Express handler so a thrown error / rejected promise is
// forwarded to next(err) automatically, instead of every controller needing
// its own try/catch + res.status(err.status || 500).json(...) boilerplate.
// Usage: router.get('/', asyncHandler(ctrl.list));
export default function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
