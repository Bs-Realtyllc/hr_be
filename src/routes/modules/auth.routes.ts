import express from 'express';
const router = express.Router();
import {
  login,
  verifyOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  getLoginHistory,
  adminGetAllLoginHistory,
  adminGetEmployeeLoginHistory,
  twoFactorStatus,
  twoFactorSetup,
  twoFactorEnable,
  twoFactorDisable,
  twoFactorRegenerateBackupCodes,
  twoFactorVerifyTotp,
  twoFactorVerifyBackup,
  twoFactorRequestEmailOtp,
  twoFactorVerifyEmailOtp,
  getTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
} from '../../controllers/auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { authLimiter, twoFactorLimiter } from '../../middleware/rateLimiters';

router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.put('/password', authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/login-history', authenticate, getLoginHistory);
router.get('/admin/login-history', authenticate, requireRole('admin'), adminGetAllLoginHistory);
router.get('/admin/employees/:employeeId/login-history', authenticate, requireRole('admin'), adminGetEmployeeLoginHistory);

// ── 2FA setup / management (own account) ───────────────────────────────────────
router.get('/2fa/status', authenticate, twoFactorStatus);
router.post('/2fa/setup', authenticate, twoFactorSetup);
router.post('/2fa/enable', authenticate, twoFactorEnable);
router.delete('/2fa/disable', authenticate, twoFactorDisable);
router.post('/2fa/backup-codes/regenerate', authenticate, twoFactorRegenerateBackupCodes);
router.get('/2fa/trusted-devices', authenticate, getTrustedDevices);
router.delete('/2fa/trusted-devices', authenticate, revokeAllTrustedDevices);
router.delete('/2fa/trusted-devices/:deviceId', authenticate, revokeTrustedDevice);

// ── 2FA login verification (pre-session, authenticated only by the temp token) ─
router.post('/2fa/verify', twoFactorLimiter, twoFactorVerifyTotp);
router.post('/2fa/backup/verify', twoFactorLimiter, twoFactorVerifyBackup);
router.post('/2fa/email-otp/request', twoFactorLimiter, twoFactorRequestEmailOtp);
router.post('/2fa/email-otp/verify', twoFactorLimiter, twoFactorVerifyEmailOtp);


export default router;
