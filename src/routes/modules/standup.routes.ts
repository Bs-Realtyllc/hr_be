import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/standup.controller';
import { authenticate } from '../../middleware/auth';

router.get('/today', authenticate, ctrl.today);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);

export default router;
