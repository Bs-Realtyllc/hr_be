import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/server.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/',authenticate,requireRole('admin'), ctrl.list);
router.post('/',authenticate,requireRole('admin'), ctrl.create);
router.put('/:id',authenticate,requireRole('admin'), ctrl.update);
router.delete('/:id',authenticate,requireRole('admin'), ctrl.remove);

export default router;
