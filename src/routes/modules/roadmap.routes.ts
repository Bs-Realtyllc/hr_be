import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/roadmap.controller';

// Public endpoint — no authentication required — consumed by the GITGI website
router.get('/', ctrl.getRoadmap);

export default router;
