import express from 'express';
const router = express.Router();
import modulesRouter from './modules';

router.use(modulesRouter);

export default router;
