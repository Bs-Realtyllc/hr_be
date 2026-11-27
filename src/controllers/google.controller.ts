import { Request, Response } from 'express';
import * as googleService from '../services/google.service';

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    res.json({ url: googleService.getAuthUrl() });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Back to the admin's Profile → Integrations tab, where Connect was clicked.
const integrationsUrl = (result: string) => `${process.env.FRONTEND_URL}/profile?tab=integrations&google=${result}`;

export const handleCallback = async (req: Request, res: Response) => {
  const { code, error } = req.query;

  // The admin pressed Cancel on Google's consent screen
  if (error) return res.redirect(integrationsUrl('cancelled'));
  if (!code) return res.redirect(integrationsUrl('error'));

  try {
    await googleService.handleCallback(code as string);
    res.redirect(integrationsUrl('connected'));
  } catch (err: any) {
    console.error('[google] OAuth callback error:', err.message);
    res.redirect(integrationsUrl('error'));
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
