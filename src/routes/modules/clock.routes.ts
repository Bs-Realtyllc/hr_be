import express from 'express';
const router = express.Router();
import { clockIn, getClock, clockOut, pause, resume, getActiveNow, getAttendance, getMyAttendance } from '../../controllers/clock.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.post('/in',authenticate, clockIn);
router.get('/',authenticate, getClock);
router.post('/out', authenticate, clockOut);

router.post('/pause', authenticate, pause);
router.post('/resume', authenticate, resume);

// Who's currently clocked in is fine for every employee to see — the
// repo/service layer already strips email/phone/address from this one.
router.get('/all', authenticate, getActiveNow);

// Full historical attendance across everyone is admin/lead only.
router.get('/attendance', authenticate, requireRole('admin', 'lead'), getAttendance);

// Any employee can see their own history.
router.get('/attendance/me', authenticate, getMyAttendance);

export default router