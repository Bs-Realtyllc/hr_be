import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import {enqueueOperationLog} from '../pkg/requestLogQueue'

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // console.log(err)
    enqueueOperationLog({
      status: "failure",
      operation: "failed",
      metadata: {
        status: err.status,
        error: err.message
      },
    });
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Upload limits, e.g. more otherDocument files than its maxCount.
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_UNEXPECTED_FILE'
        ? `Too many files, or an unexpected file field: ${err.field}`
        : err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large.'
          : err.message;
    return res.status(400).json({ error: message });
  }

  // Drizzle wraps driver errors, so the MySQL code lives on err.cause.
  const dbErr = err.code ? err : err.cause;
  if (dbErr?.code === 'ER_DUP_ENTRY') {
    const isEmail = /for key '[^']*email'/.test(dbErr.sqlMessage ?? '');
    return res.status(409).json({
      error: isEmail ? 'An account with this email already exists' : 'That record already exists',
    });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
