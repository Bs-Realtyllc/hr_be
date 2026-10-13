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
} from '../../controllers/auth.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiters';

router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.put('/password', authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/login-history', authenticate, getLoginHistory);
router.get('/admin/login-history', authenticate, requireRole('admin'), adminGetAllLoginHistory);
router.get('/admin/employees/:employeeId/login-history', authenticate, requireRole('admin'), adminGetEmployeeLoginHistory);


export default router;
