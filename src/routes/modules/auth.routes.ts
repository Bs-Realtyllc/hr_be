import express from 'express';
const router = express.Router();
import { login, changePassword, forgotPassword, resetPassword } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiters';

router.post('/login', authLimiter, login);
router.put('/password', authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
