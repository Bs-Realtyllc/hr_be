import express from 'express';
const router = express.Router();
import { authenticate, requireRole } from '../../middleware/auth';
import * as googleCtrl from '../../controllers/google.controller';
import * as meetingsCtrl from '../../controllers/meeting.controller';

router.get('/auth-url', authenticate, requireRole('admin'), googleCtrl.getAuthUrl);
router.get('/callback', googleCtrl.handleCallback);
router.get('/status', authenticate, googleCtrl.getStatus);
router.delete('/disconnect', authenticate, requireRole('admin'), googleCtrl.disconnect);
router.post('/sync', authenticate, googleCtrl.sync);

router.post('/webhook', googleCtrl.webhook);

router.get('/meetings', authenticate, meetingsCtrl.list);
router.post('/meetings', authenticate, meetingsCtrl.create);
router.delete('/meetings/:id', authenticate, meetingsCtrl.remove);

export default router;
