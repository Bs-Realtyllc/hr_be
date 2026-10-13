import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as twoFactorService from '../services/twoFactor.service';
import * as authDto from '../dtos/auth.dto';
import asyncHandler from '../middleware/asyncHandler';

const TRUSTED_DEVICE_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function setTrustedDeviceCookie(res: Response, token: string) {
  res.cookie('trustedDevice', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TRUSTED_DEVICE_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
  });
}

export const login = asyncHandler(async (req: any, res: Response) => {
  const input = authDto.toLoginInput(req.body);
  const trustedDeviceToken = req.cookies?.trustedDevice || null;
  const result = await authService.login(input, { ip: req.ip, userAgent: req.headers['user-agent'], trustedDeviceToken });
  res.json(result);
});

// ── 2FA setup / management (own account, full session required) ───────────────
export const twoFactorStatus = asyncHandler(async (req: any, res: Response) => {
  const status = await twoFactorService.getTwoFactorStatus(req.user.id);
  res.json(status);
});

export const twoFactorSetup = asyncHandler(async (req: any, res: Response) => {
  const setup = await twoFactorService.generateSetup(req.user.id);
  res.json(setup);
});

export const twoFactorEnable = asyncHandler(async (req: any, res: Response) => {
  const { code, secret } = authDto.toTwoFactorEnableInput(req.body);
  const result = await twoFactorService.enableTwoFactor(req.user.id, code, secret);
  res.json(result);
});

export const twoFactorDisable = asyncHandler(async (req: any, res: Response) => {
  const { password, code } = authDto.toTwoFactorDisableInput(req.body);
  await twoFactorService.disableTwoFactor(req.user.id, password, code);
  res.json({ message: '2FA disabled' });
});

export const twoFactorRegenerateBackupCodes = asyncHandler(async (req: any, res: Response) => {
  const { code } = authDto.toTwoFactorCodeInput(req.body);
  const result = await twoFactorService.regenerateBackupCodes(req.user.id, code);
  res.json(result);
});

export const getTrustedDevices = asyncHandler(async (req: any, res: Response) => {
  const devices = await twoFactorService.getTrustedDevices(req.user.id);
  res.json(devices);
});

export const revokeTrustedDevice = asyncHandler(async (req: any, res: Response) => {
  await twoFactorService.revokeTrustedDevice(req.user.id, Number(req.params.deviceId));
  res.json({ message: 'Trusted device removed' });
});

export const revokeAllTrustedDevices = asyncHandler(async (req: any, res: Response) => {
  const result = await twoFactorService.revokeAllTrustedDevices(req.user.id);
  res.json(result);
});

// ── 2FA login verification (mid-login, authenticated only by the temp token) ───
async function issueTokensAfter2FA(req: Request, res: Response, tempToken: string, rememberDevice: boolean) {
  const result = await authService.completeTwoFactorLogin(tempToken, {
    rememberDevice,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  if (result.trustedDeviceToken) {
    setTrustedDeviceCookie(res, result.trustedDeviceToken);
  }
  res.json({ token: result.token, user: result.user });
}

export const twoFactorVerifyTotp = asyncHandler(async (req: Request, res: Response) => {
  const { tempToken, code, rememberDevice } = authDto.toTempTokenWithCodeInput(req.body);
  const employeeId = authService.decodeTwoFactorPendingToken(tempToken);
  await twoFactorService.verifyTotpCode(employeeId, code);
  await issueTokensAfter2FA(req, res, tempToken, rememberDevice);
});

export const twoFactorVerifyBackup = asyncHandler(async (req: Request, res: Response) => {
  const { tempToken, code, rememberDevice } = authDto.toTempTokenWithCodeInput(req.body);
  const employeeId = authService.decodeTwoFactorPendingToken(tempToken);
  await twoFactorService.verifyBackupCode(employeeId, code);
  await issueTokensAfter2FA(req, res, tempToken, rememberDevice);
});

export const twoFactorRequestEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { tempToken } = authDto.toTempTokenInput(req.body);
  const employeeId = authService.decodeTwoFactorPendingToken(tempToken);
  await twoFactorService.sendEmailOtp(employeeId);
  res.json({ message: 'Verification code sent to your email' });
});

export const twoFactorVerifyEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { tempToken, code, rememberDevice } = authDto.toTempTokenWithCodeInput(req.body);
  const employeeId = authService.decodeTwoFactorPendingToken(tempToken);
  await twoFactorService.verifyEmailOtp(employeeId, code);
  await issueTokensAfter2FA(req, res, tempToken, rememberDevice);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toVerifyOtpInput(req.body);
  const result = await authService.verifyOtp({ ...input, ip: req.ip || 'unknown' });
  res.json(result);
});


export const changePassword = asyncHandler(async (req: any, res: Response) => {
  const input = authDto.toChangePasswordInput(req.body);
  await authService.changePassword(req.user.id, input);
  res.json({ message: 'Password updated' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toForgotPasswordInput(req.body);
  await authService.forgotPassword(input);
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = authDto.toResetPasswordInput(req.body);
  await authService.resetPassword(input);
  res.json({ message: 'Password reset successfully. You can now log in.' });
});

export const getLoginHistory = asyncHandler(async (req: any, res: Response) => {
  const result = await authService.getLoginHistory(req.user.id, req.query);
  res.json(result);
});

export const adminGetAllLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.adminGetAllLoginHistory(req.query);
  res.json(result);
});

export const adminGetEmployeeLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.adminGetEmployeeLoginHistory(Number(req.params.employeeId), req.query);
  res.json(result);
});
