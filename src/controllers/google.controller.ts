import { Request, Response } from 'express';
import * as googleService from '../services/google.service';

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    res.json({ url: googleService.getAuthUrl() });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!code) return res.redirect(`${frontendUrl}/calendar?google_error=missing_code`);

  try {
    await googleService.handleCallback(code as string);
    res.redirect(`${frontendUrl}/calendar?google_connected=true`);
  } catch (err: any) {
    console.error('[google] OAuth callback error:', err.message);
    res.redirect(`${frontendUrl}/calendar?google_error=true`);
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const status = await googleService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

function handleGoogleError(err: any, res: Response) {
  if (err.code === 'GOOGLE_NOT_CONNECTED') return res.status(503).json({ error: err.message, code: err.code });
  if (err.code === 'GOOGLE_TOKEN_REVOKED') return res.status(401).json({ error: err.message, code: err.code });
  return res.status(500).json({ error: err.message });
}

export const disconnect = async (req: Request, res: Response) => {
  try {
    await googleService.disconnect();
    res.json({ success: true });
  } catch (err: any) {
    handleGoogleError(err, res);
  }
};

export const sync = async (req: Request, res: Response) => {
  try {
    const result = await googleService.sync();
    res.json(result);
  } catch (err: any) {
    handleGoogleError(err, res);
  }
};

export const webhook = async (req: Request, res: Response) => {
  res.status(200).send('OK');
  await googleService.handleWebhook(req.headers['x-goog-resource-state'] as string | undefined);
};
