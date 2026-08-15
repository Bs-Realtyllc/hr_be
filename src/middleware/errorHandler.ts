import { Request, Response, NextFunction } from 'express';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'That record already exists' });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
