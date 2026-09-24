import express from 'express';
const router = express.Router();
import { clockIn, getClock, clockOut, pause, resume, getAllForToday, getAttendance } from '../../controllers/clock.controller';
import { authenticate } from '../../middleware/auth';

router.post('/in',authenticate, clockIn);
router.get('/',authenticate, getClock);
router.post('/out', authenticate, clockOut);

router.post('/pause', authenticate, pause);
router.post('/resume', authenticate, resume);

router.get('/all', authenticate, getAllForToday);
router.get('/attendance', authenticate, getAttendance)

export default router