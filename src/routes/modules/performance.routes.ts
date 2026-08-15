import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/performance.controller';
import { authenticate } from '../../middleware/auth';

router.get('/trend/:employeeId', authenticate, ctrl.trend);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.put('/:id/submit', authenticate, ctrl.submit);
router.put('/:id/acknowledge', authenticate, ctrl.acknowledge);
router.delete('/:id', authenticate, ctrl.remove);

export default router;
