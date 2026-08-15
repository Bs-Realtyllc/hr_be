import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/feedback.controller';
import { authenticate } from '../../middleware/auth';

router.get('/summary', authenticate, ctrl.summary);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.delete('/:id', authenticate, ctrl.remove);

export default router;
