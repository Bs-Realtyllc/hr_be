import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/cultureEvent.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/upcoming',authenticate, ctrl.upcoming);
router.get('/',authenticate, ctrl.list);
router.post('/',authenticate, requireRole('admin', 'lead'), ctrl.create);

export default router;
