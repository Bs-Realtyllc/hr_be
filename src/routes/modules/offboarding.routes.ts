import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/offboarding.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/', authenticate, requireRole('admin', 'lead'), ctrl.list);
router.post('/', authenticate, requireRole('admin', 'lead'), ctrl.initiate);
router.get('/employee/:employeeId', authenticate, requireRole('admin', 'lead'), ctrl.listByEmployee);
router.get('/:id', authenticate, requireRole('admin', 'lead'), ctrl.get);
router.patch('/:id/tasks/:taskId', authenticate, requireRole('admin', 'lead'), ctrl.updateTask);
router.put('/:id/complete', authenticate, requireRole('admin'), ctrl.complete);
router.put('/:id/cancel', authenticate, requireRole('admin'), ctrl.cancel);

export default router;
