import express from 'express';
const router = express.Router();
import modulesRouter from './modules';

// Every domain lives in src/routes/modules/index.ts now — see that file for
// the full list. This just mounts the whole aggregate router.
router.use(modulesRouter);

export default router;
