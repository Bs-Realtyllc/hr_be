import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/overtime.controller';
import { authenticate } from '../../middleware/auth';

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id/approve', authenticate, ctrl.approve);
router.put('/:id/reject', authenticate, ctrl.reject);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.cancel);

export default router;
