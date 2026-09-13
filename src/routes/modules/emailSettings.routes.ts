import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/emailSettings.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/:employeeId',authenticate,requireRole('admin'), ctrl.get);
router.put('/:employeeId',authenticate, ctrl.save);

export default router;
