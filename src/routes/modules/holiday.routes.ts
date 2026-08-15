import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/holiday.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, requireRole('admin'), ctrl.create);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
