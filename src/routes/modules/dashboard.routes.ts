import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth';

router.get('/stats', authenticate, ctrl.getStats);
router.get('/standup-trend', authenticate, ctrl.standupTrend);
router.get('/leave-trend', authenticate, ctrl.leaveTrend);

export default router;
