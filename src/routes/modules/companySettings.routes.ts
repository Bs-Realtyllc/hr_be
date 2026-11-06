import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/companySettings.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/', authenticate, ctrl.get);
router.put('/', authenticate, requireRole('admin'), ctrl.save);
router.get('/team-access', authenticate, requireRole('admin'), ctrl.teamAccess);

export default router;
