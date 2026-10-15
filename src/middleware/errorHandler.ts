import { Request, Response, NextFunction } from 'express';
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

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'That record already exists' });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
