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

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'That record already exists' });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
