import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/calendarEvent.controller';
import { authenticate, requireRole } from '../../middleware/auth';

// Events on the /calendar page. (/events is the culture events module.)
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, requireRole('admin'), ctrl.create);
router.put('/:id', authenticate, requireRole('admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
