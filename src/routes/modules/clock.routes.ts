import express from 'express';
const router = express.Router();
import { clockIn, getClock, clockOut, pause, resume, getActiveNow, getAttendance, getMyAttendance, startIdlePrompt, confirmIdlePrompt } from '../../controllers/clock.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.post('/in',authenticate, clockIn);
router.get('/',authenticate, getClock);
router.post('/out', authenticate, clockOut);

router.post('/pause', authenticate, pause);
router.post('/resume', authenticate, resume);

// Ground-truth writes behind the "still working?" prompt — see schema.ts's
// idlePromptStartedAt/idlePromptResponseSeconds comment. GET / above already
// returns these fields for any client to reconcile against.
router.post('/idle-prompt', authenticate, startIdlePrompt);
router.post('/idle-confirm', authenticate, confirmIdlePrompt);

// Who's currently clocked in is fine for every employee to see — the
// repo/service layer already strips email/phone/address from this one.
router.get('/all', authenticate, getActiveNow);

// Full historical attendance across everyone is admin/lead only.
router.get('/attendance', authenticate, requireRole('admin', 'lead'), getAttendance);

// Any employee can see their own history.
router.get('/attendance/me', authenticate, getMyAttendance);

export default router