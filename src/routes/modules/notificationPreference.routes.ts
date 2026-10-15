import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/notificationPreference.controller';
import { authenticate } from '../../middleware/auth';

router.get('/preferences', authenticate, ctrl.getPreferences);
router.put('/preferences', authenticate, ctrl.updatePreferences);

export default router;
