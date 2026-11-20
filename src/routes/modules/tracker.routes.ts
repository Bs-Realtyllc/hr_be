import { Router } from 'express';
import { authenticate, authenticateMediaToken, requireRole } from '../../middleware/auth';
import { uploadScreenshotMemory } from '../../middleware/uplod';
import * as ctrl from '../../controllers/tracker.controller';

const router = Router();

/* The desktop app's <img>-equivalent viewers (and the admin diary view) can't
   always attach an Authorization header, so this route checks a short-lived,
   resource-scoped query token instead — must be registered before the
   blanket `authenticate` below, which would otherwise reject it for lacking
   a Bearer header. */
router.get('/screenshots/:key', authenticateMediaToken, ctrl.streamScreenshot);

router.use(authenticate);

router.post('/activity', ctrl.recordActivity);
router.post('/screenshots', uploadScreenshotMemory.single('screenshot'), ctrl.uploadScreenshot);
// Self or admin/lead — permission is checked inside the service since it
// depends on whose screenshot this is, not just the caller's role.
router.delete('/screenshots/:id', ctrl.deleteScreenshot);

// Any employee can see their own diary.
router.get('/diary/me', ctrl.getMyDiary);

// Full diary for any employee is admin/lead only.
router.get('/diary', requireRole('admin', 'lead'), ctrl.getDiary);

export default router;
